'use client'

import { useState } from "react"
import { showToast } from "@/lib/auth"

export default function Appearance() {
  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState('en')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      showToast('Appearance settings saved successfully!')
    } catch (error) {
      showToast('Failed to save appearance settings', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-zinc-900 mb-6">Appearance Settings</h2>
        <p className="text-sm text-zinc-600 mb-6">
          Customize the appearance and language of your account.
        </p>

        <div className="space-y-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 mb-6">Theme</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={theme === 'light'}
                  onChange={(e) => setTheme(e.target.value)}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-zinc-300"
                />
                <span className="ml-2 text-sm text-zinc-700">Light</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={theme === 'dark'}
                  onChange={(e) => setTheme(e.target.value)}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-zinc-300"
                />
                <span className="ml-2 text-sm text-zinc-700">Dark</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="auto"
                  checked={theme === 'auto'}
                  onChange={(e) => setTheme(e.target.value)}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-zinc-300"
                />
                <span className="ml-2 text-sm text-zinc-700">Auto (system preference)</span>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="language" className="block text-sm font-medium text-zinc-700 mb-6">
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 mb-6">Display Options</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-zinc-300 rounded"
                />
                <span className="ml-2 text-sm text-zinc-700">Show tooltips</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-zinc-300 rounded"
                />
                <span className="ml-2 text-sm text-zinc-700">Compact mode</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-zinc-300 rounded"
                />
                <span className="ml-2 text-sm text-zinc-700">High contrast</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                isLoading
                  ? 'bg-cyan-400 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-700'
              }`}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}