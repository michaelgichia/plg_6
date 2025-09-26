'use server'

import {QuizPublic, QuizzesService} from '@/client'

import {mapApiError} from '@/lib/mapApiError'
import {Result} from '@/lib/result'

/**
 * Fetch all quizzes.
 * Returns a Result<QuizPublic[]> that must be checked with `res.ok`.
 */
export async function getQuizzes(
  courseId: string,
): Promise<Result<QuizPublic[]>> {
  try {
    const response = await QuizzesService.getApiV1QuizzesByCourseId({
      path: {course_id: courseId},
      responseValidator: async () => {},
    })

    return {
      ok: true,
      data: response.data?.data ?? [],
    }
  } catch (err) {
    return {
      ok: false,
      error: mapApiError(err),
    }
  }
}
