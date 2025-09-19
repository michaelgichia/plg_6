'use server'

import {UsersService, type UserPublic} from '@/client'
import {get} from '@/utils'

export type UserActionState = {
  success: boolean | null
  message?: string | null
}

export async function getMe(): Promise<UserPublic | undefined> {
  try {
    const response = await UsersService.getApiV1UsersMe()
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

export async function updateMe(payload: {
  full_name?: string
  email?: string
}): Promise<UserPublic | undefined> {
  try {
    const response = await UsersService.patchApiV1UsersMe({
      body: {
        full_name: payload.full_name,
        email: payload.email,
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

export async function updateMyPassword(payload: {
  current_password: string
  new_password: string
}): Promise<{message: string} | undefined> {
  try {
    const response = await UsersService.patchApiV1UsersMePassword({
      body: payload,
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

export async function updateProfileAction(
  _state: UserActionState | undefined,
  formData: FormData,
): Promise<UserActionState> {
  try {
    const full_name = (formData.get('full_name') as string) || undefined
    const email = (formData.get('email') as string) || undefined
    await UsersService.patchApiV1UsersMe({
      body: { full_name, email },
    })
    return { success: true, message: 'Profile updated' }
  } catch (error) {
    const errorMsg = get(
      error as Record<string, never>,
      'detail',
      'API request failed',
    )
    return { success: false, message: errorMsg }
  }
}

export async function updatePasswordAction(
  _state: UserActionState | undefined,
  formData: FormData,
): Promise<UserActionState> {
  try {
    const current_password = formData.get('current_password') as string
    const new_password = formData.get('new_password') as string
    await UsersService.patchApiV1UsersMePassword({
      body: { current_password, new_password },
    })
    return { success: true, message: 'Password updated' }
  } catch (error) {
    const errorMsg = get(
      error as Record<string, never>,
      'detail',
      'API request failed',
    )
    return { success: false, message: errorMsg }
  }
}


