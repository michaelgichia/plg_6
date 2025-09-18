'use server'

import {cookies} from 'next/headers'
import {redirect} from 'next/navigation'

import {IAuthState} from '@/types/auth'
import {BodyLoginLoginAccessToken, LoginService, UsersService} from '@/client'
import {get} from '@/utils'
import {SignUpSchema} from '@/types/form'

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
): Promise<IAuthState | undefined> {
  try {
    const data: BodyLoginLoginAccessToken = {
      username: formData!.get('email') as string,
      password: formData!.get('password') as string,
      grant_type: 'password',
    }

    const response = await LoginService.postApiV1LoginAccessToken({body: data})
    const accessToken = get(response, 'data.access_token')

    if (accessToken) {
      const cookieStore = cookies()
      cookieStore.set('access_token', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      })

      redirect('/dashboard')
    }

    if (response?.error) {
      throw response.error
    }

    return {
      message: 'Invalid credentials',
      success: false,
    }
  } catch (error: any) {
    // Re-throw redirect errors so Next.js can handle them
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }

    const errorMsg = get(
      error as Record<string, never>,
      'detail',
      'Something went wrong.',
    )

    return {
      message: errorMsg,
      success: false,
    }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('access_token')
  redirect('/login')
}

export async function register(formData: SignUpSchema): Promise<IAuthState> {
  try {
    const response = await UsersService.postApiV1UsersSignup({
      body: formData,
    })

    if (response?.error) {
      throw response.error
    }

    return {
      message: 'Account created successfully! Please log in.',
      success: true,
    }
  } catch (error) {
    const errorMsg = get(
      error as Record<string, never>,
      'detail',
      'Something went wrong.',
    )

    return {
      message: errorMsg,
      success: false,
    }
  }
}
