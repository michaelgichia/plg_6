import {CoursePublic, CoursesService} from '@/client'

export const getCourse = async (id: string): Promise<CoursePublic> => {
  // On the server, use the SDK directly (cookie-based auth already wired)
  if (typeof window === 'undefined') {
    const response = await CoursesService.getApiV1CoursesById({
      path: {id},
      responseValidator: async () => {},
    })
    return response.data
  }

  // On the client, route through an internal API handler so we can
  // forward the HttpOnly cookie from the browser automatically.
  const res = await fetch(`/api/courses/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error('API request failed')
  }
  return (await res.json()) as CoursePublic
}
