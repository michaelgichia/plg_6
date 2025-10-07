import {type NextRequest, NextResponse} from 'next/server'

import {get} from '@/utils'
import {QuizSessionPublicWithResults, QuizSessionsService} from '@/client'
import API_ROUTES from '@/services/url-services'

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
  ctx: RouteContext<typeof API_ROUTES.QUIZ_SESSION_BY_ID>,
): Promise<NextResponse<QuizSessionPublicWithResults | ErrorResponse>> {
  try {
    const { sessionId } = await ctx.params

    const response = await QuizSessionsService.getApiV1QuizSessionsById({
      path: { id: sessionId },
      responseValidator: async (): Promise<void> => { },
    })

    const sessionData: QuizSessionPublicWithResults = response.data as QuizSessionPublicWithResults

    return NextResponse.json(sessionData)
  } catch (error) {
    const clientError = error as Record<string, never>

    const status: number = get(
      clientError,
      'response.status',
      500,
    )

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
