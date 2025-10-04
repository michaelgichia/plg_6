'use client'

import {useActionState} from 'react'
import {Loader, MoreVertical} from 'react-feather'
import {Button} from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

import {deleteCourse} from '@/actions/courses'

export default function DeleteCourse({
  courseId,
}: {
  courseId?: string
  className?: string
}) {
  const [state, formData, isPending] = useActionState(deleteCourse, {
    ok: false,
    error: null,
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='p-1'>
          <MoreVertical className='size-3' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-40'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!state.ok && state.error?.message && (
          <div className='mb-2 px-2'>
            <p className='text-sm text-red-500'>Error: {state.error.message}</p>
          </div>
        )}
        <DropdownMenuItem asChild>
          <form action={formData} className='inline'>
            <input type='hidden' name='id' value={courseId} />
            <Button
              type='submit'
              variant='ghost'
              className='text-red-500 w-full justify-start'
              disabled={isPending}
            >
              <Loader
                className={`size-3 mr-2 animate-spin ${
                  isPending ? 'inline-block' : 'hidden'
                }`}
              />
              Delete Course
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
