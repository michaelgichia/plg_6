import { cache } from 'react';

import {CourseWithDocuments} from '@/client'
import {Result} from '@/lib/result'
import {mapApiError} from '@/lib/mapApiError'

const getCourseCached = cache(async (
  id: string,
): Promise<Result<CourseWithDocuments>> => {
  try {
    const res = await fetch(`/api/courses/${id}`, {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
    })

    if (!res.ok) throw new Error(`Failed to fetch course ${id}`)

    return {ok: true, data: (await res.json()) as CourseWithDocuments}
  } catch (error) {
    return {
      ok: false,
      error: mapApiError(error),
    }
  }
});

export { getCourseCached as getCourse };
