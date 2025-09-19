'use server'

import {DocumentsService} from '@/client'


export async function deleteDocument(formData: FormData) {
  const documentId = formData.get('documentId') as string
  if (!documentId) {
    throw new Error('Missing documentId')
  }
  await DocumentsService.postApiV1DocumentsProcess({
    path: {id: documentId},
    responseValidator: async () => {},
  })
}
