import React from 'react'
import { LoadingState } from '@/types/chat'

interface LoadingIndicatorProps {
  loadingState: LoadingState
}

export function LoadingIndicator({ loadingState }: LoadingIndicatorProps) {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.2s]"></div>
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.4s]"></div>
      </div>
      <span className="text-muted-foreground text-sm">
        {loadingState === 'thinking' && 'Athena is thinking...'}
        {loadingState === 'searching' && 'Searching course materials...'}
        {loadingState === 'generating' && 'Generating response...'}
        {!loadingState && 'Processing...'}
      </span>
    </div>
  )
}