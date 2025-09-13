'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { UserPublic, UsersService, isLoggedIn } from '@/lib/auth'

interface AuthContextType {
  user: UserPublic | null
  isLoading: boolean
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  const refreshUser = async () => {
    try {
      const loggedIn = isLoggedIn()
      
      if (loggedIn) {
        const userData = await UsersService.readUserMe()
        setUser(userData)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setUser(null)
      setIsAuthenticated(false)
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
      }
    } finally {
      setIsLoading(false)
      setHasInitialized(true)
    }
  }

  useEffect(() => {
    if (!hasInitialized) {
      refreshUser()
    }
  }, [hasInitialized])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}