'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthContext } from '@/contexts/AuthContext'
import { emailPattern, namePattern } from '@/lib/auth'
import { EyeIcon, EyeOffIcon } from '@/components/ui/icons'
import AuthBackground from '@/components/auth/AuthBackground'

interface UserRegisterForm {
  email: string
  full_name: string
  password: string
  confirm_password: string
}

export default function SignUpPage() {
  const [formData, setFormData] = useState<UserRegisterForm>({
    email: '',
    full_name: '',
    password: '',
    confirm_password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { signUp, error, isLoading, resetError } = useAuth()
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
      case 'full_name':
        if (!value) {
          error = 'Name is required'
        } else if (value.length < 3) {
          error = 'Name must be at least 3 characters'
        } else if (!namePattern.value.test(value)) {
          error = namePattern.message
        }
        break
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
      case 'confirm_password':
        if (!value) {
          error = 'Password confirmation is required'
        } else if (value !== formData.password) {
          error = 'The passwords do not match'
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

    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms & policy'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await signUp(formData)
    } catch {
      // Error is handled by useAuth hook
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold mb-10">Get Started Now</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium mb-2">
                Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Enter your name"
                required
                value={formData.full_name}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  errors.full_name
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-zinc-300 focus:ring-cyan-500 focus:border-cyan-500'
                }`}
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
              )}
            </div>

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
                placeholder="••••••••"
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

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                placeholder="••••••••"
                required
                value={formData.confirm_password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  errors.confirm_password
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-zinc-300 focus:ring-cyan-500 focus:border-cyan-500'
                }`}
              />
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked)
                  if (errors.terms) {
                    setErrors(prev => ({ ...prev, terms: '' }))
                  }
                }}
                className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-zinc-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-zinc-700">
                I agree to the terms & policy
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-600">{errors.terms}</p>
            )}

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
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <div className="my-6 text-center text-sm text-zinc-500">
            <span>Or</span>
          </div>

          <div className="text-center">
            <p className="text-sm text-zinc-600">
              Have an account?{' '}
              <Link href="/login" className="text-cyan-600 hover:text-cyan-500 hover:underline font-medium">
                Sign In
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