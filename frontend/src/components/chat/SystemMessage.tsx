import React from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageActions } from './MessageActions'
import { LoadingIndicator } from './LoadingIndicator'
import { MarkdownRenderer } from './MarkdownRenderer'
import { ContinueButton } from './ContinueButton'
import { ChatPublic } from '@/client'
import { LoadingState } from '@/types/chat'

interface SystemMessageProps {
  message: ChatPublic
  loadingState: LoadingState
  isLoading: boolean
  copiedMessageId: string | null
  showContinueButton: string | null
  onCopyMessage: (messageText: string, messageId: string) => Promise<void>
  onRegenerateResponse: (messageId: string) => Promise<void>
  onContinue: (messageId: string) => Promise<void>
}

export function SystemMessage({
  message,
  loadingState,
  isLoading,
  copiedMessageId,
  showContinueButton,
  onCopyMessage,
  onRegenerateResponse,
  onContinue
}: SystemMessageProps) {
  return (
    <div className='flex items-start gap-3 max-w-4xl group'>
      <Avatar className='h-8 w-8 mt-1 flex-shrink-0'>
        <AvatarFallback className='bg-primary text-primary-foreground text-xs'>
          AT
        </AvatarFallback>
      </Avatar>
      <div className='min-w-0 flex-1'>
        <div className='bg-card rounded-lg p-3 text-card-foreground border border-border'>
          {message.message === '' ? (
            <LoadingIndicator loadingState={loadingState} />
          ) : (
            <MarkdownRenderer content={message.message} />
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
            onCopy={onCopyMessage}
            onRegenerate={onRegenerateResponse}
          />
        )}

        {/* Continue Button */}
        {showContinueButton === message.id && (
          <ContinueButton
            messageId={message.id}
            isLoading={isLoading}
            onContinue={onContinue}
          />
        )}
      </div>
    </div>
  )
}