import { QuizSessionPublicWithResults } from '@/client'
import { Result } from '@/lib/result'
import { mapApiError } from '@/lib/mapApiError'
import API_ROUTES, { buildApiPath } from '@/services/url-services'

export async function getQuizSession(
  id: string,
  sessionId: string
): Promise<Result<QuizSessionPublicWithResults>> {
  try {
    const apiUrl = buildApiPath(API_ROUTES.QUIZ_SESSION_BY_ID, { id: id, sessionId: sessionId })
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    if (!res.ok) throw new Error(`Failed to fetch course ${id}`)

    const data = await res.json() as QuizSessionPublicWithResults

    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: mapApiError(error),
    }
  }
}
