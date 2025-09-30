'use server'

import {
  CoursesService,
  QuizPublic,
  QuizScoreSummary,
  QuizSessionPublic,
  QuizSessionPublicWithQuizzes,
  QuizSessionsService,
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
  _state: unknown,
  formatData: FormData,
): Promise<Result<[QuizSessionPublic, QuizzesPublic]>> {
  try {
    // const payload = zGetApiV1QuizSessionsData.safeParse({
    //   courseId: formatData.get('courseId'),
    // })
    // console.log("[Course ]", payload)

    // if (!payload.success) {
    //   return {
    //     ok: false,
    //     error: {
    //       code: 'VALIDATION',
    //       message: 'Validation failed',
    //       details: payload.error.message,
    //     },
    //   }
    // }

    const courseId = formatData.get('courseId') as string
    console.log("[courseId ]", courseId)
    const response = await CoursesService.postApiV1CoursesByCourseIdQuizStart({
      path: { course_id: courseId },
      responseValidator: async () => {},
    })
    console.log("[response ]", response)

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

/**
 * Submit a quiz session.
 * Returns a Result<QuizScoreSummary> that must be checked with `res.ok`.
 */
export async function submitQuizSession(
  _state: unknown,
  formData: FormData,
): Promise<Result<QuizScoreSummary>> {
  try {
    const quizId = formData.get('quizId') as string
    const answers = formData.get('answers') as string
    const response = await QuizSessionsService.postApiV1QuizSessionsByIdScore({
      query: {
        session_id: quizId,
      },
      body: {
        submissions: JSON.parse(answers),
        total_time_seconds: 0,
      },
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

export async function getQuizSession(id: string): Promise<Result<QuizSessionPublicWithQuizzes>> {
  try {
    const response = await QuizSessionsService.getApiV1QuizSessions({
      query: { session_id: id },
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