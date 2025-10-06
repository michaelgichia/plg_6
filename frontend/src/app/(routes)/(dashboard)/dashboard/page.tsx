import {getCourses} from '@/actions/courses'
import CoursesList from '@/components/courses-list'
import ErrorBox from '@/components/ui/ErrorBox'

export default async function DashboardPage() {
  const result = await getCourses()

  console.log("[DashboardPage]", result)


  if (!result.ok) {
    return <ErrorBox error={result.error} />
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4'>
      <CoursesList courses={result.data} />
    </div>
  )
}
