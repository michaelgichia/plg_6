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
 * Get flashcards
 */
export async function GET(
  _req: NextRequest,
  context: ContextParams,
): Promise<NextResponse> {
  try {
    const {id} = await context.params
    const response = await CoursesService.getApiV1CoursesByIdFlashcards({
      path: {id: id},
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
