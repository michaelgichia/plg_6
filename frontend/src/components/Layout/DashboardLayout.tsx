import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          <div className="mb-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}