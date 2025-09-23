import {DocumentPublic, DocumentsService} from '@/client'

import {handleError} from '@/actions/handleErrors'
import {IState} from '@/types/common'

export async function uploadDocuments(
  courseId: string,
  documents: File[],
): Promise<{message: string} | {documents: DocumentPublic[]} | IState> {
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
      requestValidator: async () => {},
    })
    return response.data
  } catch (error) {
    return {
      message: handleError(error),
      success: false,
    }
  }
}
