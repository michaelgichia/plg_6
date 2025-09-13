import Link from "next/link"
import { UserMenu } from "./UserMenu"

export default function Navbar() {
  return (
    <div className="sticky top-0 z-50 hidden md:flex justify-between items-center bg-zinc-100 w-full p-4 mb-6">
      <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
        <div className="text-xl font-bold text-zinc-900 p-2">
          StudyCompanion
        </div>
      </Link>
      <div className="flex gap-2 items-center">
        <UserMenu />
      </div>
    </div>
  )
}