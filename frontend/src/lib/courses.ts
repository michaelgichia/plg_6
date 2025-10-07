import { CourseWithDocuments } from '@/client';
import { Result } from '@/lib/result';
import { mapApiError } from '@/lib/mapApiError';
import API_ROUTES, { buildApiPath } from '@/services/url-services';
import axios, { AxiosResponse } from 'axios';

const getCourseCached = async (
  id: string,
): Promise<Result<CourseWithDocuments>> => {
  const apiUrl = buildApiPath(API_ROUTES.GET_COURSE_BY_ID, { id });

  try {
    const res: AxiosResponse<CourseWithDocuments> = await axios.get(apiUrl, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return { ok: true, data: res.data };

  } catch (error) {
    console.error('Error fetching course:', error);
    return {
      ok: false,
      error: mapApiError(error),
    };
  }
};

export { getCourseCached as getCourse };
