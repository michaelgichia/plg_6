import {FileText} from 'react-feather'

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import AppSidebar from '@/components/app-sidebar'

const items = [
  {
    title: 'Ancient Rome',
    url: '#',
    icon: FileText,
  },
  {
    title: 'Calculus II',
    url: '#',
    icon: FileText,
  },
  {
    title: 'Organic Chemistry',
    url: '#',
    icon: FileText,
  },
  {
    title: 'Art History',
    url: '#',
    icon: FileText,
  },
  {
    title: 'Settings',
    url: '#',
    icon: FileText,
  },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
