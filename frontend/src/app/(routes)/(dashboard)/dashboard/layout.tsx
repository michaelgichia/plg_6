
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import AppSidebar from '@/components/app-sidebar'
import { getCourses } from '@/actions/courses'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
