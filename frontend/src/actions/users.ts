'use server'

import {UsersService, type UserPublic} from '@/client'
import {handleError} from './handleErrors'
import {IState} from '@/types/common'

export type UserActionState = {
  success: boolean | null
  message?: string | null
}

export async function getMe(): Promise<UserPublic | IState> {
  try {
    const response = await UsersService.getApiV1UsersMe()
    return response.data
  } catch (error) {
    return {
      message: handleError(error),
      success: false,
    }
  }
}

export async function updateMe(payload: {
  full_name?: string
  email?: string
}): Promise<UserPublic | IState> {
  try {
    const response = await UsersService.patchApiV1UsersMe({
      body: {
        full_name: payload.full_name,
        email: payload.email,
      },
    })
    return response.data
  } catch (error) {
    return {
      message: handleError(error),
      success: false,
    }
  }
}

export async function updateMyPassword(payload: {
  current_password: string
  new_password: string
}): Promise<{message: string} | IState> {
  try {
    const response = await UsersService.patchApiV1UsersMePassword({
      body: payload,
    })
    return response.data
  } catch (error) {
    return {
      message: handleError(error),
      success: false,
    }
  }
}

export async function updateProfileAction(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState | IState> {
  try {
    const full_name = (formData.get('full_name') as string) || undefined
    const email = (formData.get('email') as string) || undefined
    await UsersService.patchApiV1UsersMe({
      body: {full_name, email},
    })
    return {success: true, message: 'Profile updated'}
  } catch (error) {
    return {
      message: handleError(error),
      success: false,
    }
  }
}

export async function updatePasswordAction(
  _state: UserActionState | undefined,
  formData: FormData,
): Promise<UserActionState | IState> {
  try {
    const current_password = formData.get('current_password') as string
    const new_password = formData.get('new_password') as string
    await UsersService.patchApiV1UsersMePassword({
      body: {current_password, new_password},
    })
    return {success: true, message: 'Password updated'}
  } catch (error) {
    return {
      message: handleError(error),
      success: false,
    }
  }
}
