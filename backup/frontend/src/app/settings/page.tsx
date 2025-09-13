import { Metadata } from 'next'
import DashboardLayout from "@/components/Layout/DashboardLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import SettingsContent from "./SettingsContent"

export const metadata: Metadata = {
  title: 'User Settings',
  description: 'Manage your account settings and preferences',
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SettingsContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}