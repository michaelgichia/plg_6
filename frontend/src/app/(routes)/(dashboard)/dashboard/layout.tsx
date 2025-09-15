import {FileText} from 'react-feather'

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import AppSidebar from '@/components/app-sidebar'
import { getSidebarMenu } from '@/actions/items'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const response = await getSidebarMenu();

  const items = response?.map(({ title }) => ({
    title,
    url: '#',
    icon: FileText,
  }))

  return (
    <SidebarProvider>
      <AppSidebar items={items} />
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
