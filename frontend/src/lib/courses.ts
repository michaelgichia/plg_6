import {CoursePublic, CoursesService} from '@/client'

export const getCourse = async (id: string): Promise<CoursePublic> => {
  const response = await CoursesService.getApiV1CoursesById({
    path: { id },
    // Skip strict response Zod validation due to backend datetime format
    responseValidator: async () => {},
  })
  return response.data
}
