import React from 'react'
import { ChatPublic } from '@/client'
import { LoadingState } from '@/types/chat'
import { SystemMessage } from './SystemMessage'
import { UserMessage } from './UserMessage'

interface MessageListProps {
  messages: ChatPublic[]
  loadingState: LoadingState
  isLoading: boolean
  copiedMessageId: string | null
  showContinueButton: string | null
  onCopyMessage: (messageText: string, messageId: string) => Promise<void>
  onRegenerateResponse: (messageId: string) => Promise<void>
  onContinue: (messageId: string) => Promise<void>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export function MessageList({
  messages,
  loadingState,
  isLoading,
  copiedMessageId,
  showContinueButton,
  onCopyMessage,
  onRegenerateResponse,
  onContinue,
  messagesEndRef
}: MessageListProps) {
  return (
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
              <SystemMessage
                message={message}
                loadingState={loadingState}
                isLoading={isLoading}
                copiedMessageId={copiedMessageId}
                showContinueButton={showContinueButton}
                onCopyMessage={onCopyMessage}
                onRegenerateResponse={onRegenerateResponse}
                onContinue={onContinue}
              />
            ) : (
              <UserMessage
                message={message}
                isLoading={isLoading}
                copiedMessageId={copiedMessageId}
                onCopyMessage={onCopyMessage}
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}