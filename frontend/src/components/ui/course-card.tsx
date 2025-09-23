import * as React from 'react'
import {Calendar, ArrowUpRight} from 'react-feather'

import {CoursePublic} from '@/client'
import {cn} from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

type CourseWithOptionalDate = CoursePublic & {created_at?: string | null}

function formatDate(input?: string | null) {
  if (!input) return '—'
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

export default function CourseCard({
  course,
  className,
}: {
  course: CourseWithOptionalDate
  className?: string
}) {
  const createdLabel = formatDate(
    course.created_at ?? (course as unknown as {createdAt?: string}).createdAt,
  )

  return (
    <Card className={cn('bg-muted/20 py-4', className)}>
      <CardHeader className='[.border-b]:pb-4'>
        <CardTitle className='text-lg break-all'>{course.name}</CardTitle>
        <div data-slot='card-action'>
          <Link
            href={{
              pathname: '/dashboard/courses/[id]',
              query: {id: course.id, tab: 'chat'},
            }}
            as={`/dashboard/courses/${course.id}?tab=chat`}
          >
            <span className='text-xs inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-muted-foreground hover:text-blue-500 pointer hover:border-blue-500'>
              <ArrowUpRight className='size-3' />
              Details
            </span>
          </Link>
        </div>
        <CardDescription className='line-clamp-2'>
          {course.description ?? 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='text-sm text-muted-foreground flex items-center gap-2'>
          <Calendar className='size-3' />
          <span className='text-xs'>Created at</span>
          <span className='text-foreground'>{createdLabel}</span>
        </div>
      </CardContent>
    </Card>
  )
}
