import { CourseWithDocuments } from '@/client'
import { Result } from '@/lib/result'
import { mapApiError } from '@/lib/mapApiError'
import API_ROUTES, { buildApiPath } from '@/services/url-services';

const getCourseCached = async (
  id: string,
): Promise<Result<CourseWithDocuments>> => {
  const apiUrl = buildApiPath(API_ROUTES.GET_COURSE_BY_ID, { id: id })
  try {
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    if (!res.ok) throw new Error(`Failed to fetch course ${id}`)

    return { ok: true, data: (await res.json()) as CourseWithDocuments }
  } catch (error) {
    return {
      ok: false,
      error: mapApiError(error),
    }
  }
};

export { getCourseCached as getCourse };
