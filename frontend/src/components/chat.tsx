'use client'

import React from 'react'

import {useState, useEffect, useRef} from 'react'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Mic} from 'react-feather'
import { ChatMessage, getHistory, createChatStream } from '@/actions/chat'
import { set } from 'zod'

export default function ChatComponent({ courseId }: { courseId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    getHistory(courseId).then(setMessages)
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: input,
      is_system: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Create system message placeholder
      const systemMessage: ChatMessage = {
        id: Date.now().toString() + '-system',
        message: '',
        is_system: true,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, systemMessage])

      // Start streaming
      const stream = createChatStream(courseId, input)
      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        fullResponse += decoder.decode(value)
        // Update the last message (system response) with accumulated text
        setMessages(prev => prev.map((msg, i) => 
          i === prev.length - 1 ? { ...msg, message: fullResponse } : msg
        ))
      }
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e)
    }
  }

  return (
    <div className='h-full flex flex-col'>
      {/* Chat Messages */}
      <div className='flex-1 overflow-hidden p-6 space-y-4'>
         <div className="space-y-2">  
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                !message.is_system ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.is_system && (
                <div className='flex items-start gap-3 max-w-4xl'>
                  <Avatar className='h-8 w-8 mt-1'>
                    <AvatarImage src={message.avatar || '/placeholder.svg'} />
                    <AvatarFallback className='bg-slate-700 text-white'>
                      CT
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='text-sm text-slate-300 mb-1'>
                      {message.author}
                    </div>
                    <div className='bg-slate-800 rounded-lg p-4 text-slate-100 whitespace-pre-line'>
                      {message.message}
                    </div>
                  </div>
                </div>
              )}
              {!message.is_system && (
                <div className='bg-blue-600 rounded-lg px-4 py-2 max-w-md text-white'>
                  {message.message}
                </div>
              )}
            </div>
          ))}

          {/* {isWaitingForResponse &&
            <div key='waiting'>
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z">
                </path>
              </svg>
            </div>
          } */}
         </div>
      </div>

      {/* Chat Input */}
      <div className='border-t border-slate-700 p-4'>
        <div className='flex items-center gap-2 mb-4'>
          <div className='flex-1 relative'>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder='Ask about your course materials...'
              disabled={isLoading}
              className='bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 pr-10'
            />
            <Button
              size='sm'
              variant='ghost'
              className='absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white'
            >
              <Mic className='h-4 w-4' />
            </Button>
          </div>
          <Button
            onClick={handleSubmit}
            className='bg-blue-600 hover:bg-blue-700 text-white'
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}
