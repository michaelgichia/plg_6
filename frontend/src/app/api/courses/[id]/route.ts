import {type NextRequest, NextResponse} from 'next/server'
import {CoursesService} from '@/client'
import {get} from '@/utils'

interface ContextParams {
  params: {
    id: string
  }
}

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
  context: ContextParams,
): Promise<NextResponse> {
  try {
    const {id} = await context.params
    const response = await CoursesService.getApiV1CoursesById({
      path: {id},
      // Skip strict response Zod validation due to backend datetime format
      responseValidator: async (): Promise<void> => {},
    })
    return NextResponse.json(response.data)
  } catch (error) {
    const status: number = get(
      error as Record<string, never>,
      'response.status',
      500,
    )
    const body: ErrorResponse = get(
      error as Record<string, never>,
      'response.data.detail',
      {
        detail: 'Internal Server Error',
      },
    )
    return NextResponse.json(body, {status})
  }
}

export const config = {
  runtime: 'nodejs',
  maxDuration: 300,
}
