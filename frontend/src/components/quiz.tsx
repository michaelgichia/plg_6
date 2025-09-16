'use client'

import React from 'react'

import {useState} from 'react'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Mic} from 'react-feather'

interface Message {
  id: string
  type: 'user' | 'tutor'
  content: string
  author?: string
  avatar?: string
}

export default function CourseDashboard() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'user',
      content: 'What is the fundamental theorem of calculus?',
    },
    {
      id: '2',
      type: 'tutor',
      content: `The Fundamental Theorem of Calculus is a theorem that links the concept of differentiating a function with the concept of integrating a function. It has two parts:

Part 1: If f is a continuous function on a closed interval [a, b], then the function F defined by F(x) = ∫ₐˣ f(t) dt is continuous on [a, b], differentiable on (a, b), and its derivative is f(x).

Part 2: If f is a continuous function on a closed interval [a, b] and F is an antiderivative of f, then ∫ₐᵇ f(x) dx = F(b) - F(a).`,
      author: 'Calculus Tutor',
      avatar: '/tutor-session.png',
    },
  ])

  const [inputValue, setInputValue] = useState('')

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: inputValue,
      }
      setMessages([...messages, newMessage])
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <div>
      {/* Chat Messages */}
      <div className='flex-1 overflow-y-auto p-6 space-y-4'>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.type === 'tutor' && (
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
                    {message.content}
                  </div>
                </div>
              </div>
            )}
            {message.type === 'user' && (
              <div className='bg-blue-600 rounded-lg px-4 py-2 max-w-md text-white'>
                {message.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className='border-t border-slate-700 p-4'>
        <div className='flex items-center gap-2'>
          <div className='flex-1 relative'>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='Ask a question...'
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
            onClick={handleSendMessage}
            className='bg-blue-600 hover:bg-blue-700 text-white'
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
