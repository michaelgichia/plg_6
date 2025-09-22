'use server'

import {DocumentsService} from '@/client'
import {IState} from '@/types/common'
import {get} from '@/utils'

export async function deleteDocument(_state: IState, formData: FormData): Promise<IState> {
  try {
    const documentId = formData.get('documentId') as string
    if (!documentId) {
      throw new Error('Missing documentId')
    }
    await DocumentsService.deleteApiV1DocumentsById({path: {id: documentId}})
    return {
      success: true,
      message: 'Document deleted successfully',
    }
  } catch (error) {
    return {
      success: false,
      message: get(
        error as Record<string, never>,
        'detail',
        'API request failed',
      ),
    }
  }
}
