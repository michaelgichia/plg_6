'use client'

import { useState } from "react"
import { FaPlus } from "react-icons/fa"
import { UsersService, UserCreate, emailPattern, showToast } from "@/lib/auth"

interface AddUserModalProps {
  onUserAdded: () => void
}

export default function AddUserModal({ onUserAdded }: AddUserModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<UserCreate & { confirm_password: string }>({
    email: '',
    full_name: '',
    password: '',
    confirm_password: '',
    is_active: true,
    is_superuser: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateField = (name: string, value: string | boolean) => {
    let error = ''

    switch (name) {
      case 'email':
        if (!value) {
          error = 'Email is required'
        } else if (!emailPattern.value.test(value as string)) {
          error = emailPattern.message
        }
        break
      case 'full_name':
        if (!value) {
          error = 'Full name is required'
        } else if ((value as string).length < 3) {
          error = 'Full name must be at least 3 characters'
        }
        break
      case 'password':
        if (!value) {
          error = 'Password is required'
        } else if ((value as string).length < 8) {
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
    const { name, value, type, checked } = e.target
    const fieldValue = type === 'checkbox' ? checked : value

    setFormData(prev => ({ ...prev, [name]: fieldValue }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
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

    // Validate all fields
    const newErrors: Record<string, string> = {}
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'is_active' && key !== 'is_superuser') {
        const fieldError = validateField(key, value)
        if (fieldError) {
          newErrors[key] = fieldError
        }
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      const { confirm_password, ...userData } = formData
      await UsersService.createUser({ requestBody: userData })
      showToast('User created successfully!')
      setFormData({
        email: '',
        full_name: '',
        password: '',
        confirm_password: '',
        is_active: true,
        is_superuser: false
      })
      setIsOpen(false)
      onUserAdded()
    } catch (error) {
      showToast('Failed to create user', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 mb-6"
      >
        <FaPlus className="mr-2" />
        Add User
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-zinc-900 mb-6">Add New User</h3>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="mb-6">
                <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700 mb-6">
                  Full Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name || ''}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    errors.full_name ? 'border-red-300' : 'border-zinc-300'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-6">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    errors.email ? 'border-red-300' : 'border-zinc-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-6">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    errors.password ? 'border-red-300' : 'border-zinc-300'
                  }`}
                  placeholder="Enter password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="confirm_password" className="block text-sm font-medium text-zinc-700 mb-6">
                  Confirm Password
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    errors.confirm_password ? 'border-red-300' : 'border-zinc-300'
                  }`}
                  placeholder="Confirm password"
                />
                {errors.confirm_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
                )}
              </div>

              <div className="flex items-center mb-6">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-zinc-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-zinc-700">
                  Active user
                </label>
              </div>

              <div className="flex items-center mb-6">
                <input
                  id="is_superuser"
                  name="is_superuser"
                  type="checkbox"
                  checked={formData.is_superuser}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-zinc-300 rounded"
                />
                <label htmlFor="is_superuser" className="ml-2 block text-sm text-zinc-700">
                  Superuser privileges
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    isLoading
                      ? 'bg-cyan-400 cursor-not-allowed'
                      : 'bg-cyan-600 hover:bg-cyan-700'
                  }`}
                >
                  {isLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}