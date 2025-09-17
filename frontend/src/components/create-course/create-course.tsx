'use client'

import {useSearchParams} from 'next/navigation'
import {useEffect, useState} from 'react'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import UploadDocuments from './upload-documents'
import CreateCourseForm from './course-form'

const COURSE_ID = 'courseId'
const STEPS = {
  CREATE_COURSE: 'create-course',
  UPLOAD_DOCUMENTS: 'upload-documents',
}

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
    <Card className='w-full'>
      {step === STEPS.CREATE_COURSE ? (
        <>
          <CardHeader>
            <CardTitle className='text-2xl font-semibold'>
              Create a new project
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <CreateCourseForm />
          </CardContent>
        </>
      ) : (
        <CardContent className='space-y-6'>
          <UploadDocuments />
        </CardContent>
      )}
    </Card>
  )
}

export default CreateCourseForm
