'use client'

import CreateCourseForm from '@/components/create-course/create-course'
import {ProjectSettings} from '@/components/project-settings'

export default function CreateCoursePage() {
  return (
    <div className='min-h-screen p-6'>
      <div className='mx-auto'>
        <div className='grid grid-cols-9 gap-4 items-start'>
          <div className='col-span-6'>
            <CreateCourseForm />
          </div>
          <div className='col-span-3'>
            <ProjectSettings />
          </div>
        </div>
      </div>
    </div>
  )
}
