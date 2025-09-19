import {getCourses} from '@/actions/courses'
import CoursesClient from '@/components/courses-client'

export default async function DashboardPage() {
  const courses = await getCourses()

  return (
    <div className='flex flex-1 flex-col gap-4 p-4'>
      <CoursesClient courses={courses ?? []} />
    </div>
  )
}
