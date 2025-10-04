'use server'

import { ItemPublic, ItemsService } from '@/client'
import { get } from '@/utils'

export async function getSidebarMenu(): Promise<ItemPublic[] | undefined> {
  try {
    const response = await ItemsService.getApiV1Items()

    if (response?.error) {
      throw new Error(
        typeof response.error?.detail === 'string'
          ? response.error.detail
          : 'API request failed'
      )
    }

    return response.data?.data ?? []
  } catch (error) {
    const errorMsg = get(
      error as Record<string, never>,
      'detail',
      'API request failed'
    )

    throw new Error(errorMsg)
  }
}
