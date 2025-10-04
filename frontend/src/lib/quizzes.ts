import {QuizSessionPublicWithResults} from '@/client'
import {Result} from '@/lib/result'
import {mapApiError} from '@/lib/mapApiError'

export async function getQuizSession(
  id: string,
  sessionId: string
): Promise<Result<QuizSessionPublicWithResults>> {
  try {
    const res = await fetch(`/api/courses/${id}/quiz-session/${sessionId}`, {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
    })

    if (!res.ok) throw new Error(`Failed to fetch course ${id}`)

    const data = await res.json() as QuizSessionPublicWithResults

    return {ok: true, data}
  } catch (error) {
    return {
      ok: false,
      error: mapApiError(error),
    }
  }
}
