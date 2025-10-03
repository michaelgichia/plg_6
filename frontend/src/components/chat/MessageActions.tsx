import React from 'react'
import { Button } from '@/components/ui/button'
import { Copy, RotateCcw, Check } from 'react-feather'
import { MessageActionsProps } from '@/types/chat'

export function MessageActions({ 
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
        className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
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
          className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}