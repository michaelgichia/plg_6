import {FlashcardPublic} from '@/client'
import {getAccessToken} from "@/lib/utils";

export const getFlashcard = async (id: string): Promise<FlashcardPublic[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/flashcards/course/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAccessToken()}` },
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error('API request failed')
  }
  return (await res.json()) as FlashcardPublic[]

}
