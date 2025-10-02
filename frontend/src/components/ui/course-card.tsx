import {Calendar, ArrowUpRight} from 'react-feather'

import {cn} from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import {formatDate} from '@/lib/date'
import {CourseWithOptionalDate} from '@/types/date'
import DeleteCourse from './delete-course'

export default function CourseCard({
  course,
  className,
}: {
  course: CourseWithOptionalDate
  className?: string
}) {
  const createdLabel = formatDate(course.created_at) ?? '-'

  return (
    <Card className={cn('bg-muted/20 py-4 justify-between', className)}>
      <CardHeader className='[.border-b]:pb-4'>
        <CardTitle className='text-lg break-word line-clamp-3'>{course.name}</CardTitle>
        <div data-slot='card-action'>
          <Link
            href={{
              pathname: '/dashboard/courses/[id]',
              query: {id: course.id, tab: 'chat'},
            }}
            as={`/dashboard/courses/${course.id}?tab=chat`}
          >
            <span className='text-xs inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-muted-foreground hover:text-cyan-500 pointer hover:border-cyan-500'>
              <ArrowUpRight className='size-3' />
              Details
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <CardDescription className='line-clamp-2'>
          {course.description ?? 'No description'}
        </CardDescription>
      </CardContent>
      <CardFooter className='pt-0 flex justify-between'>
        <div className='text-sm text-muted-foreground flex items-center gap-2'>
          <Calendar className='size-3' />
          <span className='text-xs'>{createdLabel}</span>
        </div>
        <div className='text-sm text-muted-foreground flex items-center gap-2'>
          <DeleteCourse courseId={course.id} />
        </div>
      </CardFooter>
    </Card>
  )
}
