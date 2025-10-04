'use client'

import React, { useRef } from 'react'
import { useChatLogic } from '@/hooks/useChatLogic'
import { MessageList } from './chat/MessageList'
import { ChatInput } from './chat/ChatInput'

export default function ChatComponent({ courseId }: { courseId: string }) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const {
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
  } = useChatLogic(courseId)

  return (
    <div className='h-[calc(100vh-10rem)] flex flex-col'>
      <MessageList
        messages={messages}
        loadingState={loadingState}
        isLoading={isLoading}
        copiedMessageId={copiedMessageId}
        showContinueButton={showContinueButton}
        onCopyMessage={handleCopyMessage}
        onRegenerateResponse={handleRegenerateResponse}
        onContinue={handleContinue}
        messagesEndRef={messagesEndRef}
      />
      
      <ChatInput
        input={input}
        isLoading={isLoading}
        loadingState={loadingState}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onKeyPress={handleKeyPress}
      />
    </div>
  )
}
