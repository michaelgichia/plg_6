import { Metadata } from 'next'
import DashboardLayout from "@/components/Layout/DashboardLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import ItemsContent from "./ItemsContent"

export const metadata: Metadata = {
  title: 'Items Management',
  description: 'Manage your items and inventory',
}

export default function ItemsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ItemsContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}