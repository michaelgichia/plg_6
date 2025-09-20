import {FlashcardPublic, FlashcardService} from '@/client'

export const getFlashcard = async (id: string): Promise<FlashcardPublic[]> => {
  // On the server, use the SDK directly (cookie-based auth already wired)
  if (typeof window === 'undefined') {
    const response = await FlashcardService.getApiV1FlashcardsByCourseId({
      path: {id},
      responseValidator: async () => {},
    })
    return response.data
  }
}
