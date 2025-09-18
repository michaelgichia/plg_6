import {DocumentPublic, DocumentsService} from '@/client'

import {get} from '@/utils'

export async function uploadDocuments(
  courseId: string,
  documents: File[],
): Promise<{message: string} | {documents: DocumentPublic[]}> {
  try {
    const formData = new FormData()
    formData.append('course_id', courseId)

    documents.forEach((file) => {
      formData.append('files', file)
    })
    const response = await DocumentsService.postApiV1DocumentsProcess({
      body: {
        files: documents,
        course_id: courseId,
      },
    })
    return response.data
  } catch (error) {
    const errorMsg = get(
      error as Record<string, never>,
      'detail',
      'API request failed',
    )

    throw new Error(errorMsg)
  }
}
