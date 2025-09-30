'use client'

import {ChevronRight} from 'react-feather'
import {useState, useEffect} from 'react'
import {useRouter} from 'next/navigation'

import {Button} from '@/components/ui/button'
import {Separator} from '@/components/ui/separator'
import {CourseWithDocuments} from '@/client'
import FileCard from '@/components/ui/file-card'
import {getCourse} from '@/lib/courses'
import UploadComponent from '@/components/upload-component'

export default function UploadDocuments({courseId}: {courseId: string}) {
  const [course, setCourse] = useState<CourseWithDocuments>()
  const router = useRouter()

  const fetchCourse = async (id: string) => {
    try {
      const result = await getCourse(id)
      if (result.ok) {
        setCourse(result.data)
      }
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

  const isDisabled = !(course?.documents ?? []).some(doc => doc.status === "completed");
  const documents = course?.documents ?? []
  return (
    <div className='space-y-2'>
      {(
        <>
          <UploadComponent courseId={courseId} />

          <Separator className='my-8' />
          {documents.length > 0 && (
            <div className='space-y-1'>
              {documents.map((file) => (
                <FileCard file={file} key={file.id} />
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
