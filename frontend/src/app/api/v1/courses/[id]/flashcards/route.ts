import { type NextRequest, NextResponse } from 'next/server'
import { CoursesService, QaItem } from '@/client'
import { get } from '@/utils'
import API_ROUTES from '@/services/url-services'

interface ErrorResponse {
  detail: string
}

/**
 * Get flashcards
 */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<typeof API_ROUTES.FLASHCARDS>,
): Promise<NextResponse<QaItem[] | ErrorResponse>> {
  try {
    const { id } = await ctx.params;

    const response = await CoursesService.getApiV1CoursesByIdFlashcards({
      path: { id },
      responseValidator: async (): Promise<void> => { },
    });

    const flashcardList: QaItem[] = response.data as QaItem[];

    return NextResponse.json(flashcardList);
  } catch (error) {
    const clientError = error as Record<string, never>

    const status: number = get(
      clientError,
      'response.status',
      500,
    );

    const detail: string = get(
      clientError,
      'response.data.detail',
      'Internal Server Error',
    );

    const body: ErrorResponse = { detail };

    return NextResponse.json(body, { status });
  }
}

export const config = {
  runtime: 'nodejs',
  maxDuration: 300,
}
