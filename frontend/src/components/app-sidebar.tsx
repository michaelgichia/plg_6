'use client'

import React, {useEffect, useState} from 'react'
import {getCourses} from '@/actions/courses'

import {User, ChevronUp, Plus, Zap, FileText} from 'react-feather'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {logout} from '@/actions/auth'
import Link from 'next/link'
import {CoursePublic} from '@/client/types.gen'

export function AppSidebar({...props}) {
  const [courses, setCourses] = useState<CoursePublic[]>([])

  useEffect(() => {
    const fetchCourses = async () => {
      const data = await getCourses()
      if (data) setCourses(data)
    }
    fetchCourses()
  }, [])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                    <Zap className='size-4' />
                  </div>
                  <div className='flex flex-col gap-0.5 leading-none'>
                    <span className='font-medium'>Study Companion</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {courses?.map((course) => {
                return (
                  <SidebarMenuItem key={course.id}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={{
                          pathname: '/dashboard/courses/[id]',
                          query: {id: course.id, tab: 'quiz'},
                        }}
                        as={`/dashboard/courses/${course.id}?tab=quiz`}
                      >
                        <FileText />
                        <span>{course.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
            <SidebarMenu>
              <SidebarMenuButton asChild>
                <Link href='/dashboard/courses/create'>
                  <Plus /> <span>Add Project</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User /> Username
                  <ChevronUp className='ml-auto' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side='top'
                className='w-[--radix-popper-anchor-width]'
              >
                <DropdownMenuItem>
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <form action={logout}>
                    <button
                      type='submit'
                      className='w-full text-left cursor-pointer'
                    >
                      Sign out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
