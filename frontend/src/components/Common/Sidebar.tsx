'use client'

import { useState } from "react"
import { FaBars } from "react-icons/fa"
import { FiLogOut, FiX } from "react-icons/fi"
import { useAuthContext } from "@/contexts/AuthContext"
import { useAuth } from "@/hooks/useAuth"
import SidebarItems from "./SidebarItems"

export default function Sidebar() {
  const { user: currentUser } = useAuthContext()
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-800 text-white rounded-md hover:bg-zinc-700 transition-colors"
        aria-label="Open Menu"
      >
        <FaBars />
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`md:hidden fixed left-0 top-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex justify-between items-center mb-6">
            <div className="text-lg font-bold text-zinc-900">Menu</div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-zinc-100 rounded"
            >
              <FiX />
            </button>
          </div>

          <div className="flex-1">
            <SidebarItems onClose={() => setIsOpen(false)} />

            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-4 py-2 text-zinc-700 hover:bg-zinc-100 rounded transition-colors w-full text-left mb-6"
            >
              <FiLogOut />
              <span>Log Out</span>
            </button>
          </div>

          {currentUser?.email && (
            <div className="text-sm text-zinc-600 p-2 border-t truncate">
              Logged in as: {currentUser.email}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex sticky top-0 bg-zinc-50 min-w-64 h-screen p-4 mb-6">
        <div className="w-full">
          <SidebarItems />
        </div>
      </div>
    </>
  )
}