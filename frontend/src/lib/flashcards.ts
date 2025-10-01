import {
  GetApiV1CoursesByCourseIdFlashcardsResponses as FlashcardResponse
} from "@/client";
import {Result} from '@/lib/result'
import {mapApiError} from '@/lib/mapApiError'

export async function getFlashcards(
  id: string,
): Promise<Result<FlashcardResponse>> {
  try {
    const res = await fetch(`/api/courses/${id}/flashcards`, {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
    })

    if (!res.ok) throw new Error(`Failed to fetch course ${id} flashcards`)
    return {ok: true, data: (await res.json()) as FlashcardResponse}
  } catch (error) {
    return {
      ok: false,
      error: mapApiError(error),
    }
  }
}
