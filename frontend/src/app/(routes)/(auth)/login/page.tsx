'use client'

import {useActionState, useState} from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

import {authenticate} from '@/actions/auth'
import {IAuthState} from '@/types/auth'
import {validateField} from '@/lib/form'
import PasswordInput from '@/components/ui/auth/PasswordInput'

const AuthBackground = dynamic(
  () => import('@/components/ui/auth/AuthBackground'),
  {ssr: true},
)

export default function Login() {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [state, formAction, isPending] = useActionState<
    IAuthState | undefined,
    FormData
  >(authenticate, {
    error: undefined,
    ok: false,
  })

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const {name, value} = e.target
    const fieldError = validateField(name, value)
    setErrors((prev) => ({...prev, [name]: fieldError}))
  }

  return (
    <div className='flex min-h-screen'>
      {/* Left side - Form */}
      <div className='w-full lg:w-1/2 flex flex-col justify-between px-8 md:px-16 lg:px-24'>
        <section className='relative z-20 w-full flex items-center px-4 sm:px-12 py-4 sm:py-6 bg-transparent justify-between'>
          <div className='flex items-center gap-2'>
            <Link href='/' className='flex items-center gap-2'>
              <span className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg mr-2'>
                <svg
                  className='size-4'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <path d='M13 2L3 14h9l-1 8L21 10h-9l1-8z' />
                </svg>
              </span>
              <span className='font-medium text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white'>
                Athena
              </span>
            </Link>
          </div>
        </section>
        <div className='max-w-md mx-auto w-full'>
          <h1 className='text-3xl font-bold mb-10'>Welcome Back</h1>
          <form action={formAction} className='space-y-6'>
            <div>
              <label htmlFor='email' className='block text-sm font-medium mb-2'>
                Email address
              </label>
              <input
                id='email'
                name='email'
                type='email'
                placeholder='Enter your email'
                required
                className='w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500'
                onBlur={handleBlur}
              />
              {errors.email && (
                <p className='mt-1 text-sm text-red-600'>{errors.email}</p>
              )}
            </div>

            <div>
              <PasswordInput
                id='password'
                name='password'
                onBlur={handleBlur}
                error={errors?.password || null}
                label='Password'
              />
              {state && !state?.ok && (
                <div className='text-red-500 text-sm'>
                  {state?.error?.message}
                </div>
              )}
            </div>

            <div className='flex items-center justify-between'>
              <Link
                href='/recover-password'
                className='text-sm text-cyan-600 hover:text-cyan-500 hover:underline'
              >
                Forgot your password?
              </Link>
            </div>

            <button
              type='submit'
              className='w-full py-3 px-4 bg-cyan-800 hover:bg-cyan-800 text-white font-medium rounded-md transition duration-200'
              disabled={isPending}
            >
              Login{isPending && '...'}
            </button>
          </form>
          <div className='my-6 text-center text-sm text-gray-500'>
            <span>Or</span>
          </div>
          <div className='text-center'>
            <p className='text-sm text-gray-600'>
              Don’t have an account?{' '}
              <Link href='/signup' className='text-cyan-600 hover:underline'>
                Sign up
              </Link>
            </p>
          </div>
        </div>
        <section>{/* Do not delete */}</section>
      </div>

      {/* Right side - Image */}
      <AuthBackground />
    </div>
  )
}
