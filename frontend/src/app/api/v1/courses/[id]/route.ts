import { type NextRequest, NextResponse } from 'next/server'

import { API_ROUTES } from "@/services/url-services"
import { CoursesService, CourseWithDocuments } from '@/client'
import { get } from '@/utils'


interface ErrorResponse {
  detail: string
}

/**
 * API Route Handler for fetching a single course by ID.
 *
 * WHY: This route proxies requests to the backend CoursesService to retrieve
 * detailed information about a specific course. It handles backend errors gracefully,
 * ensuring that frontend consumers receive meaningful error messages and status codes.
 * Skips strict Zod validation due to backend datetime format inconsistencies.
 *
 * @param _req - The incoming Next.js request object (unused).
 * @param context - Contains route parameters, specifically the course ID.
 * @returns NextResponse containing course data or an error response.
 */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<typeof API_ROUTES.GET_COURSE_BY_ID>,
): Promise<NextResponse<CourseWithDocuments | ErrorResponse>> {
  try {
    const { id } = await ctx.params

    const response = await CoursesService.getApiV1CoursesById({
      path: { id },
      responseValidator: async (): Promise<void> => { },
    })

    const courseData = response.data

    return NextResponse.json(courseData)
  } catch (error) {
    const clientError = error as Record<string, never>

    const status: number = get(clientError, 'response.status', 500)

    const detail: string = get(
      clientError,
      'response.data.detail',
      'Internal Server Error',
    )

    const body: ErrorResponse = { detail }

    return NextResponse.json(body, { status })
  }
}

export const config = {
  runtime: 'nodejs',
  maxDuration: 300,
}
