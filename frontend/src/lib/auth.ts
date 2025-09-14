// Auth utilities for Next.js app

// API Configuration
const API_BASE_URL = 'http://localhost:8000'

export interface AccessToken {
  username: string
  password: string
}

export interface UserRegister {
  email: string
  full_name?: string | null
  password: string
}

export interface UserPublic {
  id: string
  email: string
  full_name?: string | null
  is_active?: boolean
  is_superuser?: boolean
}

export interface UserCreate {
  email: string
  password: string
  full_name?: string | null
  is_active?: boolean
  is_superuser?: boolean
}

export interface UserUpdate {
  email?: string | null
  full_name?: string | null
  password?: string | null
  is_active?: boolean
  is_superuser?: boolean
}

export interface ItemPublic {
  id: string
  title: string
  description?: string | null
  owner_id: string
}

export interface Item {
  id: string
  title: string
  description?: string | null
  owner_id: string
}

export interface ItemCreate {
  title: string
  description?: string | null
}

export interface ItemUpdate {
  title?: string | null
  description?: string | null
}

export interface ApiError {
  body: {
    detail: string | Array<{ msg: string }>
  }
  status: number
}

// Helper function for API requests

// Validation patterns
export const emailPattern = {
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  message: "Invalid email address",
}

export const namePattern = {
  value: /^[A-Za-z\s\u00C0-\u017F]{1,30}$/,
  message: "Invalid name",
}

export const passwordRules = (isRequired = true) => {
  const rules: Record<string, unknown> = {
    minLength: {
      value: 8,
      message: "Password must be at least 8 characters",
    },
  }

  if (isRequired) {
    rules.required = "Password is required"
  }

  return rules
}

export const confirmPasswordRules = (
  password: string,
  isRequired = true,
) => {
  const rules: Record<string, unknown> = {
    validate: (value: string) => {
      return value === password ? true : "The passwords do not match"
    },
  }

  if (isRequired) {
    rules.required = "Password confirmation is required"
  }

  return rules
}

// Auth state management
export const isLoggedIn = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("access_token") !== null
  }
  return false
}

// Toast notification mock
export const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // Replace with actual toast implementation
  console.log(`Toast (${type}): ${message}`)
}

export const handleError = (err: ApiError) => {
  const errDetail = err.body?.detail
  let errorMessage = "Something went wrong."

  if (typeof errDetail === 'string') {
    errorMessage = errDetail
  } else if (Array.isArray(errDetail) && errDetail.length > 0) {
    errorMessage = errDetail[0].msg
  }

  showToast(errorMessage, 'error')
}