'use client'

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { FaUserAstronaut } from "react-icons/fa"
import { FiLogOut, FiUser } from "react-icons/fi"
import { useAuthContext } from "@/contexts/AuthContext"
import { useAuth } from "@/hooks/useAuth"

export function UserMenu() {
  const { user } = useAuthContext()
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  return (
    <div className="relative mb-6" ref={menuRef}>
      <button
        data-testid="user-menu"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors max-w-sm truncate"
      >
        <FaUserAstronaut className="text-lg" />
        <span>{user?.full_name || "User"}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <FiUser className="text-lg" />
            <span>My Profile</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors w-full text-left"
          >
            <FiLogOut />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  )
}