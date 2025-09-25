'use client'

import React from 'react'

import {useState, useEffect,} from 'react'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Mic} from 'react-feather'
import { ChatMessage, getHistory, sendChat } from '@/actions/chat'
import { CourseWithDocuments } from '@/client'

export default function CourseDashboard({ course }: { course: CourseWithDocuments }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    setIsWaitingForResponse(true);
    getHistory({}).then(response => {
      setMessages(response);
      setIsWaitingForResponse(false);
    })
  }, []);

  const handleSendMessage = async() => {
    if (inputValue.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        is_system: false,
        message: inputValue,
      }
      setMessages([...messages, newMessage])
      setInputValue('')

      // send chat to api
      setIsWaitingForResponse(true);
      const response = await sendChat({
        message: inputValue
      });

      if(response) {
        setMessages(prev => {
          return [
            ...prev,
            response as ChatMessage
          ];
        })
      }
      setIsWaitingForResponse(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isWaitingForResponse) {
      handleSendMessage()
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
                <div className='bg-cyan-600 rounded-lg px-4 py-2 max-w-md text-white'>
                  {message.message}
                </div>
              )}
            </div>
          ))}

          {isWaitingForResponse &&
            <div key='waiting'>
              <svg className="animate-spin h-8 w-8 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z">
                </path>
              </svg>
            </div>
          }
         </div>
      </div>

      {/* Chat Input */}
      <div className='border-t border-slate-700 p-4'>
        <div className='flex items-center gap-2 mb-4'>
          <div className='flex-1 relative'>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder='Ask a question...'
            />
            <Button
              variant='ghost'
              className='absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white'
            >
              <Mic className='h-4 w-4' />
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={isWaitingForResponse}
            variant="secondary"
            size="lg"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
