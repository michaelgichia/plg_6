import * as React from 'react'
import {Calendar, ArrowUpRight} from 'react-feather'

import {cn} from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { formatDate } from '@/lib/date'
import { CourseWithOptionalDate } from '@/types/date'

export default function CourseCard({
  course,
  className,
}: {
  course: CourseWithOptionalDate
  className?: string
}) {
  const createdLabel = formatDate(course.created_at) ?? '-'

  return (
    <Card className={cn('bg-muted/20 py-4', className)}>
      <CardHeader className='[.border-b]:pb-4'>
        <CardTitle className='text-lg break-word'>{course.name}</CardTitle>
        <div data-slot='card-action'>
          <Link
            href={{
              pathname: '/dashboard/courses/[id]',
              query: {id: course.id, tab: 'quiz'},
            }}
            as={`/dashboard/courses/${course.id}?tab=quiz`}
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
          <span className='text-xs'>{createdLabel}</span>
        </div>
      </CardContent>
    </Card>
  )
}
