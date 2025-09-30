'use server'

import {
  CoursesService,
  QuizPublic,
  QuizSessionPublic,
  QuizStats,
  QuizzesPublic,
} from '@/client'

import { mapApiError } from '@/lib/mapApiError'
import { Result } from '@/lib/result'

/**
 * Fetch all quizzes.
 * Returns a Result<QuizPublic[]> that must be checked with `res.ok`.
 */
export async function getQuizzes(
  courseId: string,
): Promise<Result<QuizPublic[]>> {
  try {
    const response = await CoursesService.getApiV1CoursesByIdQuizzes({
      query: { course_id: courseId },
      responseValidator: async () => { },
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
    const response = await CoursesService.getApiV1CoursesByIdAttempts({
      path: { id: courseId },
      responseValidator: async () => { },
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
 * Fetch quiz stats.
 * Returns a Result<QuizStats> that must be checked with `res.ok`.
 */
export async function getQuizStats(
  courseId: string,
): Promise<Result<QuizStats>> {
  try {
    const response = await CoursesService.getApiV1CoursesByCourseIdStats({
      path: { course_id: courseId },
      responseValidator: async () => { },
    })

    return {
      ok: true,
      data: response.data,
    }
  } catch (err) {
    return {
      ok: false,
      error: mapApiError(err),
    }
  }
}

/**
 * Start a quiz session.
 * Returns a Result<QuizSessionPublic> that must be checked with `res.ok`.
 */
export async function startQuizSession(
  courseId: string,
): Promise<Result<[QuizSessionPublic, QuizzesPublic]>> {
  try {
    const response = await CoursesService.postApiV1CoursesByCourseIdQuizStart({
      path: { course_id: courseId },
      responseValidator: async () => { },
    })

    return {
      ok: true,
      data: response.data,
    }
  } catch (error) {
    return {
      ok: false,
      error: mapApiError(error),
    }
  }
}
