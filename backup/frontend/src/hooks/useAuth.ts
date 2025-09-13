'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import {
  AccessToken,
  UserRegister,
  LoginService,
  UsersService,
  handleError,
  showToast,
  login as loginUtil,
  logout as logoutUtil
} from '@/lib/auth'

export const useAuth = () => {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { refreshUser } = useAuthContext()

  const signUp = useCallback(async (data: UserRegister & { confirm_password: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      await UsersService.registerUser({ requestBody: data })
      showToast('Account created successfully! Please log in.')
      router.push('/login')
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const login = useCallback(async (data: AccessToken) => {
    setIsLoading(true)
    setError(null)

    try {
      await loginUtil(data)
      // Refresh user data after successful login
      await refreshUser()
      showToast('Login successful!')
      router.push('/dashboard')
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }, [router, refreshUser])

  const logout = useCallback(() => {
    logoutUtil()
    // Refresh auth state after logout
    refreshUser()
    router.push('/login')
  }, [router, refreshUser])

  const recoverPassword = useCallback(async (email: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await LoginService.recoverPassword({ email })
      showToast('Password recovery email sent successfully.')
      return true
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Password recovery failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (newPassword: string, token: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await LoginService.resetPassword({
        requestBody: { new_password: newPassword, token }
      })
      showToast('Password updated successfully.')
      router.push('/login')
      return true
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Password reset failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return {
    signUp,
    login,
    logout,
    recoverPassword,
    resetPassword,
    error,
    isLoading,
    resetError
  }
}