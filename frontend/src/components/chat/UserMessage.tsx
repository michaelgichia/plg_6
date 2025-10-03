import React from 'react'
import { MessageActions } from './MessageActions'
import { ChatPublic } from '@/client'

interface UserMessageProps {
  message: ChatPublic
  isLoading: boolean
  copiedMessageId: string | null
  onCopyMessage: (messageText: string, messageId: string) => Promise<void>
}

export function UserMessage({
  message,
  isLoading,
  copiedMessageId,
  onCopyMessage
}: UserMessageProps) {
  return (
    <div className="group max-w-md">
      <div className='bg-primary rounded-lg px-4 py-2 text-primary-foreground'>
        <div className="whitespace-pre-wrap">{message.message}</div>
      </div>
      {/* User Message Actions */}
      <MessageActions
        messageId={message.id}
        messageText={message.message!}
        isSystemMessage={false}
        isLoading={isLoading}
        copiedMessageId={copiedMessageId}
        onCopy={onCopyMessage}
        className="justify-end mt-1"
      />
    </div>
  )
}