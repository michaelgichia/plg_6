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
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Something went wrong.' }))
    throw {
      body: errorBody,
      status: response.status,
    } as ApiError
  }

  return response.json()
}

// Real API functions
export const LoginService = {
  loginAccessToken: async (data: { formData: AccessToken }) => {
    // Mock successful login
    return { access_token: 'mock-token' }
  },

  recoverPassword: async (data: { email: string }) => {
    // Mock password recovery
    return { success: true }
  },

  resetPassword: async (data: { requestBody: { new_password: string; token: string } }) => {
    // Mock password reset
    return { success: true }
  }
}

export const UsersService = {
  registerUser: async (data: { requestBody: UserRegister }) => {
    // Mock user registration
    return { success: true }
  },

  createUser: async (data: { requestBody: UserCreate }) => {
    // Mock user creation
    return {
      id: `user-${Date.now()}`,
      ...data.requestBody,
      is_active: data.requestBody.is_active ?? true,
      is_superuser: data.requestBody.is_superuser ?? false
    }
  },

  readUsers: async ({ skip = 0, limit = 100 }: { skip?: number; limit?: number }) => {
    // Mock users list
    const mockUsers: UserPublic[] = [
      {
        id: 'user-1',
        email: 'admin@example.com',
        full_name: 'Admin User',
        is_active: true,
        is_superuser: true
      },
      {
        id: 'user-2',
        email: 'user@example.com',
        full_name: 'Regular User',
        is_active: true,
        is_superuser: false
      },
      {
        id: 'user-3',
        email: 'inactive@example.com',
        full_name: 'Inactive User',
        is_active: false,
        is_superuser: false
      }
    ]

    return {
      data: mockUsers.slice(skip, skip + limit),
      count: mockUsers.length
    }
  },

  updateUser: async (data: { userId: string; requestBody: Partial<UserPublic> }) => {
    // Mock user update
    return { success: true }
  },

  deleteUser: async (data: { userId: string }) => {
    // Mock user deletion
    return { success: true }
  },

  readUserMe: async (): Promise<UserPublic> => {
    // Mock current user
    return {
      id: 'mock-user-id',
      email: 'admin@example.com',
      full_name: 'Admin User',
      is_active: true,
      is_superuser: true
    }
  }
}

export const ItemsService = {
  readItems: async ({ skip = 0, limit = 100 }: { skip?: number; limit?: number }) => {
    // Mock items list
    const mockItems: ItemPublic[] = [
      {
        id: 'item-1',
        title: 'Sample Item 1',
        description: 'This is a sample item description',
        owner_id: 'user-1'
      },
      {
        id: 'item-2',
        title: 'Sample Item 2',
        description: 'Another sample item',
        owner_id: 'user-2'
      },
      {
        id: 'item-3',
        title: 'Sample Item 3',
        owner_id: 'user-1'
      }
    ]

    return {
      data: mockItems.slice(skip, skip + limit),
      count: mockItems.length
    }
  },

  createItem: async (data: { requestBody: { title: string; description?: string } }) => {
    // Mock item creation
    return {
      id: `item-${Date.now()}`,
      ...data.requestBody,
      owner_id: 'current-user'
    }
  },

  updateItem: async (data: { itemId: string; requestBody: Partial<ItemPublic> }) => {
    // Mock item update
    return { success: true }
  },

  deleteItem: async (data: { itemId: string }) => {
    // Mock item deletion
    return { success: true }
  }
}

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

export const login = async (data: AccessToken) => {
  const response = await LoginService.loginAccessToken({
    formData: data,
  })
  if (typeof window !== 'undefined') {
    localStorage.setItem("access_token", response.access_token)
  }
  return response
}

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem("access_token")
  }
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