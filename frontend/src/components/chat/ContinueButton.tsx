import React from 'react'
import { Button } from '@/components/ui/button'

interface ContinueButtonProps {
  messageId: string
  isLoading: boolean
  onContinue: (messageId: string) => Promise<void>
}

export function ContinueButton({ messageId, isLoading, onContinue }: ContinueButtonProps) {
  return (
    <div className="mt-2">
      <Button
        onClick={() => onContinue(messageId)}
        disabled={isLoading}
        size="sm"
        variant="outline"
        className="bg-card border-border text-card-foreground hover:bg-accent hover:text-accent-foreground"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
            <span>Continuing...</span>
          </div>
        ) : (
          'Continue Response'
        )}
      </Button>
    </div>
  )
}