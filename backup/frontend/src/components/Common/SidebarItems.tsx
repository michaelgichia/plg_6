'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FiBriefcase, FiHome, FiSettings, FiUsers } from "react-icons/fi"
import { useAuthContext } from "@/contexts/AuthContext"

const items = [
  { icon: FiHome, title: "Dashboard", path: "/dashboard" },
  { icon: FiBriefcase, title: "Items", path: "/items" },
  { icon: FiSettings, title: "User Settings", path: "/settings" },
]

interface SidebarItemsProps {
  onClose?: () => void
}

export default function SidebarItems({ onClose }: SidebarItemsProps) {
  const { user: currentUser } = useAuthContext()
  const pathname = usePathname()

  const finalItems = currentUser?.is_superuser
    ? [...items, { icon: FiUsers, title: "Admin", path: "/admin" }]
    : items

  return (
    <div className="mb-6">
      <div className="px-4 py-2 text-xs font-bold text-zinc-600 mb-6">
        MENU
      </div>
      <div className="space-y-1">
        {finalItems.map(({ icon: Icon, title, path }) => (
          <Link
            key={title}
            href={path}
            onClick={onClose}
            className={`flex items-center gap-4 px-4 py-2 text-sm hover:bg-zinc-100 rounded transition-colors ${
              pathname === path ? 'bg-cyan-50 text-cyan-700 border-r-2 border-cyan-700' : 'text-zinc-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="ml-2">{title}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}