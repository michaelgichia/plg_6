'use server'

import { redirect } from 'next/navigation'

import { CoursePublic, CoursesService, CourseWithDocuments } from '@/client'
import { zCourseCreate } from '@/client/zod.gen'

import { mapApiError } from '@/lib/mapApiError'
import { Result } from '@/lib/result'

/**
 * Fetch all courses.
 * Returns a Result<CoursePublic[]> that must be checked with `res.ok`.
 */
export async function getCourses(): Promise<Result<CoursePublic[]>> {
  try {
    const response = await CoursesService.getApiV1Courses({
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
 * Fetch a single course by ID.
 * Returns a Result<CoursePublic>.
 */
export async function getCourse(id: string): Promise<Result<CourseWithDocuments>> {
  try {
    const response = await CoursesService.getApiV1CoursesById({
      path: { id },
      responseValidator: async () => {},
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
 * Create a course from FormData.
 * Returns a Result<CoursePublic> that must be checked with `res.ok`.
 * If successful, it redirects to the dashboard page.
 */
export async function createCourse(_state: unknown, formData: FormData): Promise<Result<CoursePublic>> {
  try {
    const payload = zCourseCreate.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
    })

    if (!payload.success) {
      return {
        ok: false,
        error: {
          code: 'VALIDATION',
          message: 'Validation failed',
          details: payload.error.flatten().fieldErrors,
        },
      }
    }

    const response = await CoursesService.postApiV1Courses({
      body: payload.data,
    })

    // Redirect after creation — safe to redirect only on success
    redirect(`/dashboard/courses/create?courseId=${response.data.id}`)

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
