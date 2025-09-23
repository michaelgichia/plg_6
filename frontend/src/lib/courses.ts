import {CoursesService, CourseWithDocuments} from '@/client'
import {Result} from '@/lib/result'
import {mapApiError} from '@/lib/mapApiError'

/**
 * Fetches a course with documents.
 * - On the server: calls the backend SDK directly.
 * - On the client: routes through an internal API handler to forward HttpOnly cookies.
 */
export async function getCourse(
  id: string,
): Promise<Result<CourseWithDocuments>> {
  const handleError = (error: unknown): Result<CourseWithDocuments> => ({
    ok: false,
    error: mapApiError(error),
  })

  // Server-side: use SDK
  if (typeof window === 'undefined') {
    try {
      const {data} = await CoursesService.getApiV1CoursesById({
        path: {id},
        responseValidator: async () => {},
      })
      return {ok: true, data}
    } catch (error) {
      return handleError(error)
    }
  }

  // Client-side: fetch internal API
  try {
    const res = await fetch(`/api/courses/${id}`, {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
    })

    if (!res.ok) throw new Error(`Failed to fetch course ${id}`)

    return {ok: true, data: (await res.json()) as CourseWithDocuments}
  } catch (error) {
    return handleError(error)
  }
}
