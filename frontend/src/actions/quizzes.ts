'use server'

import {CoursesService, QuizPublic, QuizSessionPublic} from '@/client'

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
    const response = await CoursesService.getApiV1CoursesByIdQuizzes({
      query: {course_id: courseId},
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

/**
 * Fetch all attempted quizzes.
 * Returns a Result<QuizSessionPublic[]> that must be checked with `res.ok`.
 */
export async function getAttemptedQuizzes(
  courseId: string,
): Promise<Result<QuizSessionPublic[]>> {
  try {
    const response = await CoursesService.getApiV1CoursesByIdIncomplete({
      path: {id: courseId},
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
