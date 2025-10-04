import { ChatPublic } from '@/client'

export type LoadingState = 'thinking' | 'searching' | 'generating' | null

export interface MessageActionsProps {
  messageId: string
  messageText: string
  isSystemMessage: boolean
  isLoading: boolean
  copiedMessageId: string | null
  onCopy: (messageText: string, messageId: string) => void
  onRegenerate?: (messageId: string) => void
  className?: string
}

export interface ChatMessage extends ChatPublic {
  // Extended properties if needed
}

export interface ChatHookReturn {
  messages: ChatPublic[]
  input: string
  isLoading: boolean
  loadingState: LoadingState
  showContinueButton: string | null
  copiedMessageId: string | null
  setInput: (value: string) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  handleContinue: (messageId: string) => Promise<void>
  handleCopyMessage: (messageText: string, messageId: string) => Promise<void>
  handleRegenerateResponse: (messageId: string) => Promise<void>
  handleKeyPress: (e: React.KeyboardEvent) => void
}