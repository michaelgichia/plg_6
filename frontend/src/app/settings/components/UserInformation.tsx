'use client'

import { useState } from "react"
import { useAuthContext } from "@/contexts/AuthContext"
import { emailPattern, showToast } from "@/lib/auth"

export default function UserInformation() {
  const { user: currentUser, refreshUser } = useAuthContext()
  const [editMode, setEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: currentUser?.full_name || '',
    email: currentUser?.email || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateField = (name: string, value: string) => {
    let error = ''

    switch (name) {
      case 'full_name':
        if (!value.trim()) {
          error = 'Full name is required'
        }
        break
      case 'email':
        if (!value) {
          error = 'Email is required'
        } else if (!emailPattern.value.test(value)) {
          error = emailPattern.message
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
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const fieldError = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: fieldError }))
  }

  const toggleEditMode = () => {
    if (editMode) {
      // Reset form data when canceling edit
      setFormData({
        full_name: currentUser?.full_name || '',
        email: currentUser?.email || '',
      })
      setErrors({})
    }
    setEditMode(!editMode)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

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

    setIsLoading(true)

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      showToast('Profile updated successfully!')
      setEditMode(false)
      refreshUser()
    } catch (error) {
      showToast('Failed to update profile', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const isDirty = formData.full_name !== (currentUser?.full_name || '') ||
                  formData.email !== (currentUser?.email || '')

  return (
    <div className="max-w-2xl">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-zinc-900">Personal Information</h2>
          {!editMode && (
            <button
              onClick={toggleEditMode}
              className="px-4 py-2 text-sm font-medium text-cyan-600 hover:text-cyan-700"
            >
              Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-6">
            <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700 mb-6">
              Full Name
            </label>
            {editMode ? (
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  errors.full_name ? 'border-red-300' : 'border-zinc-300'
                }`}
                placeholder="Enter your full name"
              />
            ) : (
              <div className="px-3 py-2 text-zinc-900 bg-zinc-50 rounded-md">
                {currentUser?.full_name || 'Not set'}
              </div>
            )}
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-6">
              Email Address
            </label>
            {editMode ? (
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
                placeholder="Enter your email address"
              />
            ) : (
              <div className="px-3 py-2 text-zinc-900 bg-zinc-50 rounded-md">
                {currentUser?.email}
              </div>
            )}
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 mb-6">Account Status</label>
            <div className="px-3 py-2 bg-zinc-50 rounded-md">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  currentUser?.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {currentUser?.is_active ? 'Active' : 'Inactive'}
                </span>
                {currentUser?.is_superuser && (
                  <span className="px-2 py-1 text-xs font-medium bg-cyan-100 text-cyan-800 rounded">
                    Administrator
                  </span>
                )}
              </div>
            </div>
          </div>

          {editMode && (
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={toggleEditMode}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !isDirty}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  isLoading || !isDirty
                    ? 'bg-zinc-400 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-700'
                }`}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}