'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthContext } from '@/contexts/AuthContext'
import { emailPattern } from '@/lib/auth'
import AuthBackground from '@/components/auth/AuthBackground'

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { recoverPassword, error, isLoading, resetError } = useAuth()
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, authLoading, router])

  const validateEmail = (value: string) => {
    if (!value) {
      return 'Email is required'
    }
    if (!emailPattern.value.test(value)) {
      return emailPattern.message
    }
    return ''
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setEmail(value)

    // Clear error when user starts typing
    if (emailError) {
      setEmailError('')
    }
    if (error) {
      resetError()
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { value } = e.target
    const error = validateEmail(value)
    setEmailError(error)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    resetError()

    // Validate email
    const error = validateEmail(email)
    if (error) {
      setEmailError(error)
      return
    }

    try {
      const success = await recoverPassword(email)
      if (success) {
        setIsSubmitted(true)
        setEmail('')
      }
    } catch {
      // Error is handled by useAuth hook
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900">
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-600">
              We&apos;ve sent a password recovery link to your email address.
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="/login"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold mb-4">Password Recovery</h1>
          <p className="text-zinc-600 mb-10">
            A password recovery email will be sent to the registered account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  emailError || error
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-zinc-300 focus:ring-cyan-500 focus:border-cyan-500'
                }`}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Recovery Email'}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link
              href="/login"
              className="text-cyan-600 hover:text-cyan-500 hover:underline text-sm"
            >
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Background */}
      <AuthBackground />
    </div>
  )
}