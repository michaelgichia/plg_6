'use client'

import { useAuthContext } from "@/contexts/AuthContext"

export default function DashboardContent() {
  const { user: currentUser } = useAuthContext()

  return (
    <div className="max-w-full">
      <div className="pt-12 mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 truncate max-w-sm mb-6">
          Hi, {currentUser?.full_name || currentUser?.email} 👋🏼
        </h1>
        <p className="text-zinc-600 mb-6">
          Welcome back, nice to see you again!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border mb-6">
          <h3 className="text-lg font-medium text-zinc-900 mb-6">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between mb-6">
              <span className="text-zinc-600">Account Status:</span>
              <span className={`font-medium ${currentUser?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                {currentUser?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {currentUser?.is_superuser && (
              <div className="flex justify-between mb-6">
                <span className="text-zinc-600">Role:</span>
                <span className="font-medium text-cyan-600">Administrator</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border mb-6">
          <h3 className="text-lg font-medium text-zinc-900 mb-6">Account Info</h3>
          <div className="space-y-4">
            <div className="mb-6">
              <span className="block text-sm text-zinc-600 mb-6">Email:</span>
              <span className="font-medium text-zinc-900">{currentUser?.email}</span>
            </div>
            <div className="mb-6">
              <span className="block text-sm text-zinc-600 mb-6">Full Name:</span>
              <span className="font-medium text-zinc-900">{currentUser?.full_name}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border mb-6">
          <h3 className="text-lg font-medium text-zinc-900 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/items"
              className="block text-cyan-600 hover:text-cyan-800 transition-colors mb-6"
            >
              Manage Items →
            </a>
            <a
              href="/settings"
              className="block text-cyan-600 hover:text-cyan-800 transition-colors mb-6"
            >
              Account Settings →
            </a>
            {currentUser?.is_superuser && (
              <a
                href="/admin"
                className="block text-cyan-600 hover:text-cyan-800 transition-colors mb-6"
              >
                User Administration →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}