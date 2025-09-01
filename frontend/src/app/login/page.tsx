'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthContext } from '@/contexts/AuthContext'
import { emailPattern } from '@/lib/auth'
import { EyeIcon, EyeOffIcon } from '@/components/ui/icons'
import AuthBackground from '@/components/auth/AuthBackground'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { login, error, isLoading, resetError } = useAuth()
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, authLoading, router])

  const validateField = (name: string, value: string) => {
    let error = ''

    switch (name) {
      case 'email':
        if (!value) {
          error = 'Email is required'
        } else if (!emailPattern.value.test(value)) {
          error = emailPattern.message
        }
        break
      case 'password':
        if (!value) {
          error = 'Password is required'
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters'
        }
        break
    }

    return error
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (error) {
      resetError()
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const fieldError = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: fieldError }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    resetError()

    // Validate all fields
    const newErrors: Record<string, string> = {}
    Object.entries(formData).forEach(([key, value]) => {
      const fieldError = validateField(key, value)
      if (fieldError) {
        newErrors[key] = fieldError
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      // Map email to username for compatibility with the auth hook
      await login({ username: formData.email, password: formData.password })
    } catch {
      // Error is handled by useAuth hook
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold mb-10">Welcome Back</h1>

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
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  errors.email
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-zinc-300 focus:ring-cyan-500 focus:border-cyan-500'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••"
                required
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 pr-12 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  errors.password
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-zinc-300 focus:ring-cyan-500 focus:border-cyan-500'
                }`}
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-zinc-500 hover:text-zinc-700 p-1.5 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeIcon width={20} height={20} />
                ) : (
                  <EyeOffIcon width={20} height={20} />
                )}
                <span className="sr-only">
                  {showPassword ? 'Hide password' : 'Show password'}
                </span>
              </button>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/recover-password"
                className="text-sm text-cyan-600 hover:text-cyan-500 hover:underline"
              >
                Forgot your password?
              </Link>
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
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="my-6 text-center text-sm text-zinc-500">
            <span>Or</span>
          </div>

          <div className="text-center">
            <p className="text-sm text-zinc-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-cyan-600 hover:text-cyan-500 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Background */}
      <AuthBackground />
    </div>
  )
}