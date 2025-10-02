'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mic, Copy, RotateCcw, Check } from 'react-feather'
import { getChatHistory } from '@/actions/chat'
import { ChatPublic } from '@/client'
import { createChatStream, readStreamAsText } from '@/lib/chat'
import { Avatar, AvatarFallback } from './ui/avatar'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MessageActionsProps {
  messageId: string
  messageText: string
  isSystemMessage: boolean
  isLoading: boolean
  copiedMessageId: string | null
  onCopy: (messageText: string, messageId: string) => void
  onRegenerate?: (messageId: string) => void
  className?: string
}

function MessageActions({ 
  messageId, 
  messageText, 
  isSystemMessage, 
  isLoading, 
  copiedMessageId, 
  onCopy, 
  onRegenerate,
  className = "" 
}: MessageActionsProps) {
  return (
    <div className={`flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${className}`}>
      <Button
        onClick={() => onCopy(messageText, messageId)}
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
      >
        {copiedMessageId === messageId ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
      {isSystemMessage && onRegenerate && (
        <Button
          onClick={() => onRegenerate(messageId)}
          disabled={isLoading}
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

export default function ChatComponent({ courseId }: { courseId: string }) {
  const [messages, setMessages] = useState<ChatPublic[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingState, setLoadingState] = useState<'thinking' | 'searching' | 'generating' | null>(null)
  const [showContinueButton, setShowContinueButton] = useState<string | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    getChatHistory(courseId)
      .then(result => {
        if (result.ok) {
          setMessages(result.data)
        } else {
          setMessages([])
        }
      })
      .catch(error => {
        console.error('Failed to fetch chat history:', error)
        setMessages([])
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
        // Remove the current system response
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
        // Regenerate with the same user question
        await handleChatRequest(userMessage.message, false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className='h-[calc(100vh-10rem)] flex flex-col'>
      {/* Chat Messages */}
      <div className='flex-1 overflow-y-auto p-6 space-y-4'>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                !message.is_system ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.is_system ? (
                <div className='flex items-start gap-3 max-w-4xl group'>
                  <Avatar className='h-8 w-8 mt-1 flex-shrink-0'>
                    <AvatarFallback className='bg-slate-700 text-white text-xs'>
                      CT
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <div className='bg-slate-800 rounded-lg p-3 text-slate-100'>
                      {message.message === '' ? (
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.4s]"></div>
                          </div>
                          <span className="text-slate-400 text-sm">
                            {loadingState === 'thinking' && 'Athena is thinking...'}
                            {loadingState === 'searching' && 'Searching course materials...'}
                            {loadingState === 'generating' && 'Generating response...'}
                            {!loadingState && 'Processing...'}
                          </span>
                        </div>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Custom styling for markdown elements
                              h1: (props: any) => <h1 className="text-xl font-bold mb-3 text-slate-100" {...props} />,
                              h2: (props: any) => <h2 className="text-lg font-bold mb-2 text-slate-100" {...props} />,
                              h3: (props: any) => <h3 className="text-base font-bold mb-2 text-slate-100" {...props} />,
                              p: (props: any) => <p className="mb-2 text-slate-100 leading-relaxed" {...props} />,
                              ul: (props: any) => <ul className="list-disc pl-4 mb-2 text-slate-100" {...props} />,
                              ol: (props: any) => <ol className="list-decimal pl-4 mb-2 text-slate-100" {...props} />,
                              li: (props: any) => <li className="mb-1 text-slate-100" {...props} />,
                              code: ({ inline, ...props }: any) => 
                                inline 
                                  ? <code className="bg-slate-700 px-1 py-0.5 rounded text-sm font-mono text-slate-200" {...props} />
                                  : <code className="block bg-slate-700 p-3 rounded text-sm font-mono text-slate-200 mb-2 overflow-x-auto" {...props} />,
                              pre: (props: any) => <pre className="bg-slate-700 p-3 rounded mb-2 overflow-x-auto" {...props} />,
                              blockquote: (props: any) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-300 mb-2" {...props} />,
                              strong: (props: any) => <strong className="font-bold text-slate-100" {...props} />,
                              em: (props: any) => <em className="italic text-slate-200" {...props} />,
                              table: (props: any) => <table className="w-full border-collapse border border-slate-600 mb-2" {...props} />,
                              th: (props: any) => <th className="border border-slate-600 px-3 py-2 bg-slate-700 text-slate-100 font-bold" {...props} />,
                              td: (props: any) => <td className="border border-slate-600 px-3 py-2 text-slate-100" {...props} />,
                            }}
                          >
                            {message.message}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    
                    {/* Message Actions */}
                    {message.message && (
                      <MessageActions
                        messageId={message.id}
                        messageText={message.message}
                        isSystemMessage={true}
                        isLoading={isLoading}
                        copiedMessageId={copiedMessageId}
                        onCopy={handleCopyMessage}
                        onRegenerate={handleRegenerateResponse}
                      />
                    )}

                    {/* Continue Button */}
                    {showContinueButton === message.id && (
                      <div className="mt-2">
                        <Button
                          onClick={() => handleContinue(message.id)}
                          disabled={isLoading}
                          size="sm"
                          variant="outline"
                          className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:text-white"
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                              <span>Continuing...</span>
                            </div>
                          ) : (
                            'Continue Response'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="group max-w-md">
                  <div className='bg-blue-600 rounded-lg px-4 py-2 text-white'>
                    <div className="whitespace-pre-wrap">{message.message}</div>
                  </div>
                  {/* User Message Actions */}
                  <MessageActions
                    messageId={message.id}
                    messageText={message.message!}
                    isSystemMessage={false}
                    isLoading={isLoading}
                    copiedMessageId={copiedMessageId}
                    onCopy={handleCopyMessage}
                    className="justify-end mt-1"
                  />
                </div>
              )
            }
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className='border-t border-slate-700 p-4'>
        <form onSubmit={handleSubmit} className='flex items-center gap-2'>
          <div className='flex-1 relative'>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder='Ask about your course materials...'
              disabled={isLoading}
              className='bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 pr-10'
              maxLength={1000}
            />
            <Button
              type="button"
              size='sm'
              variant='ghost'
              className='absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white'
              disabled={isLoading}
            >
              <Mic className='h-4 w-4' />
            </Button>
          </div>
          <Button
            type="submit"
            className='bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]'
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">
                  {loadingState === 'thinking' && 'Thinking'}
                  {loadingState === 'searching' && 'Searching'}
                  {loadingState === 'generating' && 'Generating'}
                  {!loadingState && 'Sending'}
                </span>
              </div>
            ) : (
              'Send'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}