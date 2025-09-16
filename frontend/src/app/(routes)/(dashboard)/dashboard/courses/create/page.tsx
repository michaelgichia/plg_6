'use client'

import {CreateProjectForm} from '@/components/create-project-form'
import {ProjectSettings} from '@/components/project-settings'

export default function HomePage() {
  const handleCreateProject = (data: {
    title: string
    description: string
    files: File[]
  }) => {
    console.log('Creating project:', data)
    // Handle project creation logic here
  }

  const handleCancel = () => {
    console.log('Cancelled project creation')
    // Handle cancel logic here
  }

  return (
    <div className='min-h-screen p-6'>
      <div className='mx-auto'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-9 items-start'>
          <div className='row-span-8'>
            <CreateProjectForm
              onCreateProject={handleCreateProject}
              onCancel={handleCancel}
            />
          </div>
          <div className='row-span-4'>
            <ProjectSettings />
          </div>
        </div>
      </div>
    </div>
  )
}
