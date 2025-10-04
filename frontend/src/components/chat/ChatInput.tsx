import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mic } from 'react-feather'
import { LoadingState } from '@/types/chat'

interface ChatInputProps {
  input: string
  isLoading: boolean
  loadingState: LoadingState
  onInputChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  onKeyPress: (e: React.KeyboardEvent) => void
}

export function ChatInput({
  input,
  isLoading,
  loadingState,
  onInputChange,
  onSubmit,
  onKeyPress
}: ChatInputProps) {
  return (
    <div className='border-t border-border p-4'>
      <form onSubmit={onSubmit} className='flex items-center gap-2'>
        <div className='flex-1 relative'>
          <Input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder='Ask about your course materials...'
            disabled={isLoading}
            className='bg-background border-border text-foreground placeholder:text-muted-foreground pr-10'
            maxLength={1000}
          />
          <Button
            type="button"
            size='sm'
            variant='ghost'
            className='absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
            disabled={isLoading}
          >
            <Mic className='h-4 w-4' />
          </Button>
        </div>
        <Button
          type="submit"
          className='bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]'
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">
                {loadingState === 'thinking' && 'Thinking'}
                {loadingState === 'searching' && 'Searching'}
                {loadingState === 'generating' && 'Generating'}
                {!loadingState && 'Sending'}
              </span>
            </div>
          ) : (
            'Send'
          )}
        </Button>
      </form>
    </div>
  )
}