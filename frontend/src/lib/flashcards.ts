import {
  QaItem
} from "@/client";
import { Result } from '@/lib/result'
import { mapApiError } from '@/lib/mapApiError'
import API_ROUTES, { buildApiPath } from '@/services/url-services'

export async function getFlashcards(
  id: string,
): Promise<Result<QaItem[]>> {
  const apiUrl = buildApiPath(API_ROUTES.FLASHCARDS, { id: id })
  try {
    const res = await fetch(apiUrl, {
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
