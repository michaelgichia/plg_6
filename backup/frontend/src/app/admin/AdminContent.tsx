'use client'

import { useState, useEffect } from "react"
import { useAuthContext } from "@/contexts/AuthContext"
import { UsersService, UserPublic, showToast } from "@/lib/auth"
import AddUserModal from "./AddUserModal"

const PER_PAGE = 5

export default function AdminContent() {
  const { user: currentUser } = useAuthContext()
  const [users, setUsers] = useState<UserPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadUsers()
  }, [currentPage])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await UsersService.readUsers({
        skip: (currentPage - 1) * PER_PAGE,
        limit: PER_PAGE
      })
      setUsers(response.data)
      setTotalCount(response.count)
    } catch (error) {
      showToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      await UsersService.deleteUser({ userId })
      showToast('User deleted successfully')
      loadUsers()
    } catch (error) {
      showToast('Failed to delete user', 'error')
    }
  }

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await UsersService.updateUser({
        userId,
        requestBody: { is_active: !isActive }
      })
      showToast(`User ${!isActive ? 'activated' : 'deactivated'} successfully`)
      loadUsers()
    } catch (error) {
      showToast('Failed to update user status', 'error')
    }
  }

  const totalPages = Math.ceil(totalCount / PER_PAGE)

  if (loading) {
    return (
      <div className="max-w-full">
        <div className="pt-12 mb-6">
          <h1 className="text-lg font-semibold mb-6">Users Management</h1>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-full">
      <div className="pt-12 mb-6">
        <h1 className="text-lg font-semibold mb-6">Users Management</h1>

        <div className="mb-6">
          <AddUserModal onUserAdded={loadUsers} />
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-200">
              {users.map((user) => (
                <tr key={user.id} className={loading ? 'opacity-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm ${!user.full_name ? 'text-zinc-400' : 'text-zinc-900'}`}>
                        {user.full_name || 'N/A'}
                      </span>
                      {currentUser?.id === user.id && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-teal-100 text-teal-800 rounded">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-zinc-900 truncate max-w-sm">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                    {user.is_superuser ? 'Superuser' : 'User'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.is_active ?? false)}
                        disabled={currentUser?.id === user.id}
                        className={`px-3 py-1 text-xs rounded ${
                          currentUser?.id === user.id
                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            : user.is_active
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={currentUser?.id === user.id}
                        className={`px-3 py-1 text-xs rounded ${
                          currentUser?.id === user.id
                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end items-center space-x-2 mb-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50"
            >
              Previous
            </button>

            <span className="text-sm text-zinc-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}