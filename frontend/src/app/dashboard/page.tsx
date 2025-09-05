import { Metadata } from 'next'
import DashboardLayout from "@/components/Layout/DashboardLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import DashboardContent from "./DashboardContent"

export const metadata: Metadata = {
  title: 'Dashboard - StudyCompanion',
  description: 'Dashboard overview for StudyCompanion application',
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}