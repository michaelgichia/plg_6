import {get} from '@/utils'

export function handleError(
  error: unknown,
  defaultErrMsg = 'Something wrong happened!',
): string {
  // Re-throw redirect errors so Next.js can handle them
  if (error?.digest?.startsWith('NEXT_REDIRECT')) {
    throw error
  }

  const message = get(
    error as Record<string, never>,
    'response.data.detail',
    defaultErrMsg,
  )

  return message
}
