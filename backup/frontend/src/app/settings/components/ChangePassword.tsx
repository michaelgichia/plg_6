'use client'

import { useState } from "react"
import { showToast } from "@/lib/auth"

export default function ChangePassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateField = (name: string, value: string) => {
    let error = ''

    switch (name) {
      case 'current_password':
        if (!value) {
          error = 'Current password is required'
        }
        break
      case 'new_password':
        if (!value) {
          error = 'New password is required'
        } else if (value.length < 8) {
          error = 'New password must be at least 8 characters'
        }
        break
      case 'confirm_password':
        if (!value) {
          error = 'Password confirmation is required'
        } else if (value !== formData.new_password) {
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
      showToast('Password updated successfully!')
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (error) {
      showToast('Failed to update password', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-zinc-900 mb-6">Change Password</h2>
        <p className="text-sm text-zinc-600 mb-6">
          Ensure your account is using a long, random password to stay secure.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-6">
            <label htmlFor="current_password" className="block text-sm font-medium text-zinc-700 mb-6">
              Current Password
            </label>
            <input
              id="current_password"
              name="current_password"
              type="password"
              value={formData.current_password}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.current_password ? 'border-red-300' : 'border-zinc-300'
              }`}
              placeholder="Enter your current password"
            />
            {errors.current_password && (
              <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="new_password" className="block text-sm font-medium text-zinc-700 mb-6">
              New Password
            </label>
            <input
              id="new_password"
              name="new_password"
              type="password"
              value={formData.new_password}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.new_password ? 'border-red-300' : 'border-zinc-300'
              }`}
              placeholder="Enter your new password"
            />
            {errors.new_password && (
              <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="confirm_password" className="block text-sm font-medium text-zinc-700 mb-6">
              Confirm New Password
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
              placeholder="Confirm your new password"
            />
            {errors.confirm_password && (
              <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                isLoading
                  ? 'bg-cyan-400 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-700'
              }`}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}