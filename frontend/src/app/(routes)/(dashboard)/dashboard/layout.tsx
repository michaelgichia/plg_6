import React from 'react'

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import AppSidebar from '@/components/app-sidebar'
import { client } from '@/client/client.gen'
import { cookies } from 'next/headers'
import { getMe } from '@/actions/users'

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
if (!backendBaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_BACKEND_BASE_URL is not set.');
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  let displayName = '';

  client.setConfig({
    baseURL: backendBaseUrl,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  const result = await getMe()
  if(result.ok) {
    const me = result.data
    displayName = (me.full_name && me.full_name.trim().length > 0)
      ? (me.full_name as string)
      : (me.email ?? 'User')
  }

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
