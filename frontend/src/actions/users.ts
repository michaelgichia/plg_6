'use server'

import {Message, UsersService, type UserPublic} from '@/client'
import { Result } from '@/lib/result'
import { mapApiError } from '@/lib/mapApiError'

export type UserActionState = {
  success: boolean | null
  message?: string | null
}

export async function getMe(): Promise<Result<UserPublic>> {
  try {
    const response = await UsersService.getApiV1UsersMe()
    return {
      ok: true,
      data: response.data,
    }
  } catch (error) {
    return {
      error: mapApiError(error),
      ok: false,
    }
  }
}

export async function updateMe(payload: {
  full_name?: string
  email?: string
}): Promise<Result<UserPublic>> {
  try {
    const response = await UsersService.patchApiV1UsersMe({
      body: {
        full_name: payload.full_name,
        email: payload.email,
      },
    })
    return {
      ok: true,
      data: response.data,
    }
  } catch (error) {
    return {
      error: mapApiError(error),
      ok: false,
    }
  }
}

export async function updateMyPassword(payload: {
  current_password: string
  new_password: string
}): Promise<Result<Message>> {
  try {
    const response = await UsersService.patchApiV1UsersMePassword({
      body: payload,
    })
    return {
      ok: true,
      data: response.data,
    }
  } catch (error) {
    return {
      error: mapApiError(error),
      ok: false,
    }
  }
}

export async function updateProfileAction(
  _state: UserActionState,
  formData: FormData,
): Promise<Result<UserPublic>> {
  try {
    const full_name = (formData.get('full_name') as string) || undefined
    const email = (formData.get('email') as string) || undefined
    const response = await UsersService.patchApiV1UsersMe({
      body: {full_name, email},
    })
    return {
      ok: true,
      data: response.data,
    }
  } catch (error) {
    return {
      error: mapApiError(error),
      ok: false,
    }
  }
}

export async function updatePasswordAction(
  _state: UserActionState | undefined,
  formData: FormData,
): Promise<Result<Message>> {
  try {
    const current_password = formData.get('current_password') as string
    const new_password = formData.get('new_password') as string
    const response = await UsersService.patchApiV1UsersMePassword({
      body: {current_password, new_password},
    })
    return {
      ok: true,
      data: response.data,
    }
  } catch (error) {
    return {
      error: mapApiError(error),
      ok: false,
    }
  }
}
