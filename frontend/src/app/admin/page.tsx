import { Metadata } from 'next'
import DashboardLayout from "@/components/Layout/DashboardLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import AdminContent from "./AdminContent"

export const metadata: Metadata = {
  title: 'Admin - User Management',
  description: 'User management and administration panel',
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <AdminContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}