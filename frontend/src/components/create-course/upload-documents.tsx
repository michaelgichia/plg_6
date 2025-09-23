'use client'

import {ChevronRight} from 'react-feather'
import {useState, useEffect} from 'react'
import {useRouter} from 'next/navigation'

import {Button} from '@/components/ui/button'
import {Separator} from '@/components/ui/separator'
import {CoursePublic} from '@/client'
import FileCard from '@/components/ui/file-card'
import {getCourse} from '@/lib/courses'
import UploadComponent from '@/components/upload-component'

export default function UploadDocuments({courseId}: {courseId: string}) {
  const [course, setCourse] = useState<CoursePublic>()
  const router = useRouter()

  const fetchCourse = async (id: string) => {
    try {
      const courseData = await getCourse(id)
      setCourse(courseData)
    } catch (error) {
      console.error('Failed to fetch course:', error)
    }
  }

  useEffect(() => {
    fetchCourse(courseId)

    const intervalId = setInterval(() => {
      fetchCourse(courseId)
    }, 5000)

    return () => clearInterval(intervalId)
  }, [courseId])

  function handleRedirect() {
    router.replace(`/dashboard/courses/${courseId}?tab=chat`)
  }

  const isDisabled = !(course?.documents ?? []).length

  return (
    <div className='space-y-2'>
      {(
        <>
          {<p>Course Name: {course.name}</p>}

          <UploadComponent courseId={courseId} />

          <Separator className='my-8' />
          {course.documents.length > 0 && (
            <div className='space-y-1'>
              {course.documents.map((file) => (
                <FileCard file={file} key={file.document_id} />
              ))}
            </div>
          )}

          <div className='flex justify-end mt-8'>
            <Button onClick={handleRedirect} disabled={isDisabled}>
              Complete <ChevronRight />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
