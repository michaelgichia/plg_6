
  import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
  } from '@/components/ui/sidebar'
  import AppSidebar from '@/components/app-sidebar'
  import { client } from '@/client/client.gen'
  import { UsersService } from '@/client'
  import { cookies } from 'next/headers'

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

    // fetch current user server-side for sidebar display
    const me = await UsersService.getApiV1UsersMe()
    const payload = me.data as { full_name?: string | null; email?: string | null }
    const displayName = (payload.full_name && payload.full_name.trim().length > 0)
      ? (payload.full_name as string)
      : (payload.email ?? 'User')

    return (
      <SidebarProvider>
        <AppSidebar displayName={displayName} />
        <SidebarInset>
          <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
            <SidebarTrigger className='-ml-1' />
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    )
  }
