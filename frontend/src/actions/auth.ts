'use server'

import {cookies} from 'next/headers'
import {redirect} from 'next/navigation'

import {IAuthState} from '@/types/auth'
import {
  BodyLoginLoginAccessToken,
  LoginService,
  UserPublic,
  UsersService,
} from '@/client'
import {get} from '@/utils'
import {SignUpSchema} from '@/types/form'
import {IState} from '@/types/common'
import {mapApiError} from '@/lib/mapApiError'
import {Result} from '@/lib/result'

/**
 * Authenticates a user using the provided form data.
 *
 * This function attempts to sign in a user with the given credentials.
 * If successful, it sets an HTTP-only cookie with the access token
 * and redirects the user to /dashboard.
 *
 * @param {IAuthState | undefined} _prevState - The previous authentication state (not used in this function).
 * @param {BodyLoginLoginAccessToken} formData - The form data containing the user's email and password.
 * @returns {Promise<IAuthState | undefined>} - A promise that resolves to the new authentication state.
 */
export async function authenticate(
  _prevState: IAuthState | undefined,
  formData?: FormData,
): Promise<IAuthState | IState> {
  try {
    const data: BodyLoginLoginAccessToken = {
      username: formData!.get('email') as string,
      password: formData!.get('password') as string,
      grant_type: 'password',
    }

    const response = await LoginService.postApiV1LoginAccessToken({
      body: data,
    })
    const accessToken = get(response, 'data.access_token')

    if (accessToken) {
      const cookieStore = await cookies()
      cookieStore.set('access_token', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      })
    }
  } catch (error) {
    return {
      ok: false,
      error: mapApiError(error),
    }
  }

  redirect('/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('access_token')
  redirect('/login')
}

export async function register(
  formData: SignUpSchema,
): Promise<Result<UserPublic>> {
  try {
    const response = await UsersService.postApiV1UsersSignup({
      body: formData,
    })

    return {
      data: response.data,
      ok: true,
    }
  } catch (error) {
    return {
      error: mapApiError(error),
      ok: false,
    }
  }
}
