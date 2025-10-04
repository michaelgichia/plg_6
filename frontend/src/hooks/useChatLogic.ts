import { useState, useEffect, useRef } from 'react'
import { getChatHistory } from '@/actions/chat'
import { ChatPublic } from '@/client'
import { createChatStream, readStreamAsText } from '@/lib/chat'
import { LoadingState, ChatHookReturn } from '@/types/chat'

export function useChatLogic(courseId: string): ChatHookReturn {
  const [messages, setMessages] = useState<ChatPublic[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingState, setLoadingState] = useState<LoadingState>(null)
  const [showContinueButton, setShowContinueButton] = useState<string | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load chat history on component mount
  useEffect(() => {
    getChatHistory(courseId)
      .then(result => {
        if (result.ok && result.data.length > 0) {
          setMessages(result.data)
        } else {
          // If backend didn't return a greeting, create one locally as fallback
          if (!result.ok || result.data.length === 0) {
            const fallbackGreeting: ChatPublic = {
              id: 'athena-greeting',
              message: "Hi! I'm **Athena**, your AI tutor. I'm ready to help you understand the course materials and answer any questions you have.\n\nI can help you with:\n- Explaining concepts from your course materials\n- Answering questions about specific topics\n- Creating summaries and study guides\n- Clarifying difficult content\n\nWhat would you like to learn about today?",
              is_system: true,
              course_id: courseId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            setMessages([fallbackGreeting])
          } else {
            setMessages(result.data)
          }
        }
      })
      .catch(error => {
        console.error('Failed to fetch chat history:', error)
        // Show fallback greeting even on error
        const fallbackGreeting: ChatPublic = {
          id: 'athena-greeting-error',
          message: "Hi! I'm **Athena**, your AI tutor. I'm ready to help you understand the course materials and answer any questions you have.\n\nWhat would you like to learn about today?",
          is_system: true,
          course_id: courseId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setMessages([fallbackGreeting])
      })
  }, [courseId])

  const handleChatRequest = async (message: string, isContinuation: boolean = false, targetMessageId?: string) => {
    setIsLoading(true)
    setLoadingState('thinking')
    
    let systemMessageId: string

    if (isContinuation) {
      // For continuation, use the existing message ID and hide continue button
      systemMessageId = targetMessageId!
      setShowContinueButton(null)
      setLoadingState('generating') // Continuation goes straight to generating
    } else {
      // For new messages, add user message and create system placeholder
      const userMessage: ChatPublic = {
        id: Date.now().toString(),
        message: message,
        is_system: false,
        course_id: courseId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, userMessage])
      setInput('')

      // Create system message placeholder
      systemMessageId = Date.now().toString() + '-system'
      const systemMessage: ChatPublic = {
        id: systemMessageId,
        message: '',
        is_system: true,
        course_id: courseId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, systemMessage])
      
      // Progress through loading states
      setLoadingState('searching')
      await new Promise(resolve => setTimeout(resolve, 500)) // Brief pause to show "searching"
      setLoadingState('generating')
    }

    try {
      const stream = await createChatStream(courseId, message, isContinuation)

      if (!stream) {
        throw new Error('No response stream received from server.')
      }

      let responseChunk = ''

      for await (const chunk of readStreamAsText(stream)) {
        if (chunk) {
          responseChunk += chunk

          // Check for truncation indicator
          if (chunk.includes('[Response was truncated. Ask me to continue for more details.]')) {
            setShowContinueButton(systemMessageId)
          }

          // Update message (append for continuation, replace for new)
          setMessages(prev =>
            prev.map(msg =>
              msg.id === systemMessageId
                ? { 
                    ...msg, 
                    message: isContinuation 
                      ? msg.message.replace(/\n\n\[Response was truncated\. Ask me to continue for more details\.\]$/, '') + responseChunk 
                      : responseChunk 
                  }
                : msg
            )
          )

          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
      
      // Final update to ensure all content is properly trimmed
      if (!isContinuation) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === systemMessageId
              ? { ...msg, message: responseChunk.trim() }
              : msg
          )
        )
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = isContinuation 
        ? '\n\nError continuing response. Please try again.'
        : 'Sorry, I encountered an error. Please try again.'
      
      setMessages(prev =>
        prev.map(msg =>
          msg.id === systemMessageId
            ? { 
                ...msg, 
                message: isContinuation 
                  ? msg.message + errorMessage 
                  : errorMessage 
              }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
      setLoadingState(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    const currentInput = input
    await handleChatRequest(currentInput, false)
  }

  const handleContinue = async (messageId: string) => {
    await handleChatRequest("continue", true, messageId)
  }

  const handleCopyMessage = async (messageText: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(messageText)
      setCopiedMessageId(messageId)
      // Reset copy state after 2 seconds
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  const handleRegenerateResponse = async (messageId: string) => {
    // Find the user message that corresponds to this system response
    const messageIndex = messages.findIndex(msg => msg.id === messageId)
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1]
      if (userMessage && !userMessage.is_system) {
        // Remove the current system response only
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
        
        // Create new system message placeholder for regeneration
        const newSystemMessageId = Date.now().toString() + '-system'
        const systemMessage: ChatPublic = {
          id: newSystemMessageId,
          message: '',
          is_system: true,
          course_id: courseId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, systemMessage])
        
        // Start regeneration with loading states
        setIsLoading(true)
        setLoadingState('thinking')
        
        try {
          // Progress through loading states
          setLoadingState('searching')
          await new Promise(resolve => setTimeout(resolve, 500))
          setLoadingState('generating')

          const stream = await createChatStream(courseId, userMessage.message, false)

          if (!stream) {
            throw new Error('No response stream received from server.')
          }

          let responseChunk = ''

          for await (const chunk of readStreamAsText(stream)) {
            if (chunk) {
              responseChunk += chunk

              // Check for truncation indicator
              if (chunk.includes('[Response was truncated. Ask me to continue for more details.]')) {
                setShowContinueButton(newSystemMessageId)
              }

              // Update the new system message
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === newSystemMessageId
                    ? { ...msg, message: responseChunk }
                    : msg
                )
              )

              await new Promise(resolve => setTimeout(resolve, 50))
            }
          }
          
          // Final cleanup
          setMessages(prev =>
            prev.map(msg =>
              msg.id === newSystemMessageId
                ? { ...msg, message: responseChunk.trim() }
                : msg
            )
          )
        } catch (error) {
          console.error('Regeneration error:', error)
          setMessages(prev =>
            prev.map(msg =>
              msg.id === newSystemMessageId
                ? { ...msg, message: 'Error regenerating response. Please try again.' }
                : msg
            )
          )
        } finally {
          setIsLoading(false)
          setLoadingState(null)
        }
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return {
    messages,
    input,
    isLoading,
    loadingState,
    showContinueButton,
    copiedMessageId,
    setInput,
    handleSubmit,
    handleContinue,
    handleCopyMessage,
    handleRegenerateResponse,
    handleKeyPress
  }
}