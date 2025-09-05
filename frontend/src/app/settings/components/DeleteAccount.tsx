'use client'

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { showToast } from "@/lib/auth"

export default function DeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const { logout } = useAuth()

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error')
      return
    }

    setIsDeleting(true)

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000))
      showToast('Account deleted successfully')
      logout()
    } catch (error) {
      showToast('Failed to delete account', 'error')
    } finally {
      setIsDeleting(false)
      setShowConfirmation(false)
      setConfirmText('')
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-red-200 shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-red-900 mb-6">Danger Zone</h2>

        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 mb-6">
                This action cannot be undone
              </h3>
              <p className="text-sm text-red-700 mb-6">
                Deleting your account will permanently remove all your data, including your profile,
                items, and any associated information. This action cannot be reversed.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-900 mb-6">What happens when you delete your account:</h3>
            <ul className="text-sm text-zinc-700 space-y-1 ml-4 list-disc">
              <li>All your personal information will be permanently deleted</li>
              <li>Your items and data will be removed from our servers</li>
              <li>You will be immediately logged out</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>

          {!showConfirmation ? (
            <div className="pt-4 border-t">
              <button
                onClick={() => setShowConfirmation(true)}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 rounded-md"
              >
                Delete My Account
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t space-y-4">
              <div>
                <label htmlFor="confirm-delete" className="block text-sm font-medium text-zinc-700 mb-6">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                </label>
                <input
                  id="confirm-delete"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Type DELETE here"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmation(false)
                    setConfirmText('')
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || confirmText !== 'DELETE'}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    isDeleting || confirmText !== 'DELETE'
                      ? 'bg-red-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isDeleting ? 'Deleting Account...' : 'Delete Account Permanently'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}