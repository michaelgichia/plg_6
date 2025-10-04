import {
  QaItem
} from "@/client";
import { Result } from '@/lib/result'
import { mapApiError } from '@/lib/mapApiError'

export async function getFlashcards(
  id: string,
): Promise<Result<QaItem[]>> {
  try {
    const res = await fetch(`/api/courses/${id}/flashcards`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    return { ok: true, data: (await res.json()) }
  } catch (error) {
    return {
      ok: false,
      error: mapApiError(error),
    }
  }
}
