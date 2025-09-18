'use client'

import {useSearchParams} from 'next/navigation'
import {useEffect, useState} from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import UploadDocuments from './upload-documents'
import CourseForm from './course-form'
import {COURSE_ID, STEPS} from './constant'

export function CreateCourse() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get(COURSE_ID)

  const [step, setStep] = useState(STEPS.CREATE_COURSE)

  useEffect(() => {
    if (courseId && step !== STEPS.UPLOAD_DOCUMENTS) {
      setStep(STEPS.UPLOAD_DOCUMENTS)
    }
  }, [courseId, step])

  return (
    <>
      <Card className='w-full'>
        <div className='pl-6 pr-6'>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Create</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Documents</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        {step === STEPS.CREATE_COURSE ? (
          <>
            <CardHeader>
              <CardTitle className='text-2xl font-semibold'>
                Create a new course
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <CourseForm />
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className='text-2xl font-semibold'>
                Upload documents
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {courseId && <UploadDocuments courseId={courseId} />}
            </CardContent>
          </>
        )}
      </Card>
    </>
  )
}

export default CreateCourse
