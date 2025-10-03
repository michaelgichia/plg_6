'use server'

import {
  CoursesService,
  DifficultyLevel,
  QuizPublic,
  QuizScoreSummary,
  QuizSessionPublic,
  QuizSessionPublicWithResults,
  QuizSessionsService,
  QuizStats,
  QuizzesPublic,
} from '@/client'
import { extractRawSubmissions } from '@/lib/data-extraction'
import { validateSubmissions } from '@/lib/form'

import { mapApiError } from '@/lib/mapApiError'
import { Result } from '@/lib/result'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
  _state: any,
  formData: FormData,
): Promise<Result<[QuizSessionPublic, QuizzesPublic]>> {
  let session;
  try {
    const courseId = formData.get('courseId') as string
    const difficultyLevel = formData.get('difficultyLevel') as DifficultyLevel

    const response = await CoursesService.postApiV1CoursesByCourseIdQuizStart({
      path: { course_id: courseId },
      query: { difficulty: difficultyLevel },
      responseValidator: async () => { },
    })

    session = response.data[0];
  } catch (error) {
    return {
      ok: false,
      error: mapApiError(error),
    }
  }

  redirect(`/dashboard/courses/${session.course_id}/quiz-session/${session.id}`)
}

/**
 * Submit a quiz session.
 * Returns a Result<QuizScoreSummary> that must be checked with `res.ok`.
 */
export async function submitQuizSession(
  _state: unknown,
  formData: FormData,
): Promise<Result<QuizScoreSummary>> {

  const rawData = extractRawSubmissions(formData);
  const validationResult = validateSubmissions(rawData);

  for (const error of validationResult) {
    if (!error.ok) {
      return { ok: false, error: error.error } as Result<QuizScoreSummary>;
    }
  }

  const { sessionId, submissions } = rawData;

  try {
    const response = await QuizSessionsService.postApiV1QuizSessionsByIdScore({
      query: {
        session_id: sessionId,
      },
      body: {
        submissions: submissions,
        total_time_seconds: 60000,
      },
      requestValidator: async () => {},
      responseValidator: async () => {},
    });

    return {
      ok: true,
      data: response.data,
    };
  } catch (error) {
    return {
      ok: false,
      error: mapApiError(error),
    };
  }
}

/**
 * Fetch a single quiz by ID.
 * Returns a Result<QuizPublic>.
 */
export async function getQuizSession(id: string): Promise<Result<QuizSessionPublicWithResults>> {
  try {
    const response = await QuizSessionsService.getApiV1QuizSessionsById({
      path: { id },
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
