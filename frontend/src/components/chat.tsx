'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mic } from 'react-feather'
import { createChatStream, getChatHistory } from '@/actions/chat'
import { ChatMessageUI } from '@/client/client/types.gen'
import { readStreamAsText } from '@/lib/streamResponse'

export default function ChatComponent({ courseId }: { courseId: string }) {
  const [messages, setMessages] = useState<ChatMessageUI[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {  
    getChatHistory(courseId)
      .then(data => {
        setMessages(data || [])
      })
      .catch(error => {
        console.error('Failed to fetch chat history:', error)
      })
  }, [courseId]) 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessageUI = {
      id: Date.now().toString(),
      message: input,
      is_system: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsLoading(true)

    // Create system message placeholder
    const systemMessageId = Date.now().toString() + '-system'
    const systemMessage: ChatMessageUI = {
      id: systemMessageId,
      message: '',
      is_system: true,
      created_at: new Date().toISOString(),
      author: 'Course Tutor',
      avatar: '/tutor-avatar.png',
    }
    setMessages(prev => [...prev, systemMessage])

    try {
      const stream = await createChatStream(courseId, currentInput)

      if (!stream) {
        throw new Error('No response stream received from server.')
      }

      let fullResponse = ''
      let buffer = ''

      for await (const chunk of readStreamAsText(stream)) {

        if (chunk) {
          fullResponse += chunk
          buffer += chunk

          // Update state only when buffer reaches a threshold or ends
          if (buffer.length > 30) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === systemMessageId
                  ? { ...msg, message: fullResponse }
                  : msg
              )
            )
            buffer = ''
          }
        }
        
        // Final update for any remaining chunk
        if (buffer.length > 0) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === systemMessageId
                ? { ...msg, message: fullResponse.trim() }
                : msg
            )
          )
          buffer = ''
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === systemMessageId 
            ? { ...msg, message: 'Sorry, I encountered an error. Please try again.' }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
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
                <div className='flex items-start gap-3 max-w-4xl'>
                  <Avatar className='h-8 w-8 mt-1 flex-shrink-0'>
                    <AvatarImage src={message.avatar || '/placeholder.svg'} />
                    <AvatarFallback className='bg-slate-700 text-white text-xs'>
                      CT
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    {message.author && (
                      <div className='text-sm text-slate-600 mb-1'>
                        {message.author}
                      </div>
                    )}
                    <div className='bg-slate-800 rounded-lg p-3 text-slate-100'>
                      {message.message === '' ? (
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.4s]"></div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{message.message}</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className='bg-blue-600 rounded-lg px-4 py-2 max-w-md text-white'>
                  <div className="whitespace-pre-wrap">{message.message}</div>
                </div>
              )}
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
            className='bg-blue-600 hover:bg-blue-700 text-white min-w-[80px]'
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending</span>
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