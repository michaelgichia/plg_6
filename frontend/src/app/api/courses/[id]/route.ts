import {NextResponse} from 'next/server'
import {CoursesService} from '@/client'

export async function GET(
  _req: Request,
  context: {params: {id: string}},
) {
  try {
    const {id} = context.params
    const response = await CoursesService.getApiV1CoursesById({
      path: {id},
      // Skip strict response Zod validation due to backend datetime format
      responseValidator: async () => {},
    })
    return NextResponse.json(response.data)
  } catch (error: any) {
    const status = error?.response?.status ?? 500
    const body = error?.response?.data ?? {detail: 'Internal Server Error'}
    return NextResponse.json(body, {status})
  }
}


