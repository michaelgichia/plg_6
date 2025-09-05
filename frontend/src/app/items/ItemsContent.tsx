'use client'

import { useState, useEffect } from "react"
import { FiSearch } from "react-icons/fi"
import { ItemsService, Item, showToast } from "@/lib/auth"
import AddItemModal from "./AddItemModal"

const PER_PAGE = 5

export default function ItemsContent() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadItems()
  }, [currentPage])

  const loadItems = async () => {
    try {
      setLoading(true)
      const response = await ItemsService.readItems({
        skip: (currentPage - 1) * PER_PAGE,
        limit: PER_PAGE
      })
      setItems(response.data)
      setTotalCount(response.count)
    } catch (error) {
      showToast('Failed to load items', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await ItemsService.deleteItem({ itemId })
      showToast('Item deleted successfully')
      loadItems()
    } catch (error) {
      showToast('Failed to delete item', 'error')
    }
  }

  const totalPages = Math.ceil(totalCount / PER_PAGE)

  if (loading) {
    return (
      <div className="max-w-full">
        <div className="pt-12 mb-6">
          <h1 className="text-lg font-semibold mb-6">Items Management</h1>
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
        <h1 className="text-lg font-semibold mb-6">Items Management</h1>

        <div className="mb-6">
          <AddItemModal onItemAdded={loadItems} />
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 mb-6">
            <div className="flex justify-center mb-6">
              <FiSearch className="h-12 w-12 text-zinc-400" />
            </div>
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-zinc-900 mb-6">You don&apos;t have any items yet</h3>
              <p className="text-zinc-600 mb-6">Add a new item to get started</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                  {items.map((item) => (
                    <tr key={item.id} className={loading ? 'opacity-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-zinc-900 truncate max-w-sm">
                          {item.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-zinc-900 truncate max-w-sm">
                          {item.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm truncate max-w-xs ${
                          !item.description ? 'text-zinc-400' : 'text-zinc-900'
                        }`}>
                          {item.description || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              const newTitle = prompt('Enter new title:', item.title)
                              if (newTitle && newTitle !== item.title) {
                                ItemsService.updateItem({
                                  itemId: item.id,
                                  requestBody: { title: newTitle }
                                }).then(() => {
                                  showToast('Item updated successfully')
                                  loadItems()
                                }).catch(() => {
                                  showToast('Failed to update item', 'error')
                                })
                              }
                            }}
                            className="px-3 py-1 text-xs bg-cyan-100 text-cyan-800 hover:bg-cyan-200 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-800 hover:bg-red-200 rounded"
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
          </>
        )}
      </div>
    </div>
  )
}