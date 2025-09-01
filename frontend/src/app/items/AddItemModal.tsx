'use client'

import { useState } from "react"
import { FaPlus } from "react-icons/fa"
import { ItemsService, showToast } from "@/lib/auth"

interface AddItemModalProps {
  onItemAdded: () => void
}

export default function AddItemModal({ onItemAdded }: AddItemModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateField = (name: string, value: string) => {
    let error = ''

    switch (name) {
      case 'title':
        if (!value.trim()) {
          error = 'Title is required'
        } else if (value.trim().length < 3) {
          error = 'Title must be at least 3 characters'
        }
        break
    }

    return error
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      await ItemsService.createItem({
        requestBody: {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined
        }
      })
      showToast('Item created successfully!')
      setFormData({ title: '', description: '' })
      setIsOpen(false)
      onItemAdded()
    } catch (error) {
      showToast('Failed to create item', 'error')
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
        Add Item
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-zinc-900 mb-6">Add New Item</h3>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-6">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    errors.title ? 'border-red-300' : 'border-zinc-300'
                  }`}
                  placeholder="Enter item title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-6">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter item description"
                />
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
                  {isLoading ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}