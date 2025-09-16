
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import AppSidebar from '@/components/app-sidebar'
import { client } from '@/client/client.gen'
import { cookies } from 'next/headers'
import { getCourses } from '@/actions/courses'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  // Configure axios client per request
  client.setConfig({
    baseURL: process.env.NEXT_INTERNAL_BACKEND_BASE_URL ?? 'http://localhost:8000',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  const courses = await getCourses();

  return (
    <SidebarProvider>
      <AppSidebar courses={courses} />
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
