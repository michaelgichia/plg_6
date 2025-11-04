'use client'

import {FileText, X} from 'react-feather'
import {useActionState, useEffect, useState} from 'react'
import {useParams} from 'next/navigation'
import {toast} from 'sonner'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'

import {CourseWithDocuments, DocumentPublic} from '@/client'
import {getCourse} from '@/lib/courses'
import {deleteDocument} from '@/actions/documents'
import {IState} from '@/types/common'
import UploadComponent from '@/components/upload-component'
import { format } from 'date-fns'

function sortDocuments(documents: DocumentPublic[]): DocumentPublic[] {
  return documents.sort((a, b) => {
    const dateA = new Date(a.updated_at)
    const dateB = new Date(b.updated_at)
    return dateB.getTime() - dateA.getTime()
  })
}

export default function ProjectSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [course, setCourse] = useState<CourseWithDocuments>()

  const handleOnSubmit = (_state: IState, formData: FormData) => {
    deleteDocument(_state, formData)
      .then(() => {
        if (course) {
          getCourse(course.id).then((result) => {
            if (result.ok) {
              setCourse(result.data)
            }
          })
        }
      })
      .catch(() => {
        toast.error('Failed to delete document. Please try again.')
      })
  }

  const [_state, formAction, isPending] = useActionState<IState>(
    handleOnSubmit,
    {
      message: null,
      success: false,
    },
  )

  const params = useParams()
  const courseId = params.id as string

  const fetchCourse = async (id: string) => {
    try {
      const result = await getCourse(id)
      if (result.ok) {
        setCourse(result.data)
      } else {
        toast.error('Failed to fetch course details. Please try again.')
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    fetchCourse(courseId)
  }, [courseId])

  if (isLoading) {
    return (
      <div className='p-4'>
        <p>Loading...</p>
      </div>
    )
  }

  if (!isLoading && !course) {
    return null
  }

  return (
    <div className='p-4 bg-background text-foreground'>
      <h1 className='text-xl font-semibold mb-6'>Project Settings</h1>

      {course && (
        <div className='space-y-6'>
          {/* Project Name Section */}
          <div className='space-y-2'>
            <Label
              htmlFor='project-name'
              className='text-sm text-muted-foreground'
            >
              Project Name
            </Label>
            <Input
              id='project-name'
              defaultValue={course.name}
              className='bg-muted border-border text-foreground'
            />
          </div>

          {/* Description Section */}
          <div className='space-y-2'>
            <Label
              htmlFor='description'
              className='text-sm text-muted-foreground'
            >
              Description
            </Label>
            <Textarea
              id='description'
              defaultValue={course.description}
              className='bg-muted border-border text-foreground min-h-[80px] resize-none'
            />
          </div>
          {/* Upload more documents Section */}
          <div className='space-y-2'>
            <Label
              htmlFor='upload-more-docs'
              className='text-sm text-muted-foreground'
            >
              Upload More Documents
            </Label>
            <UploadComponent
              courseId={course.id}
              callback={() => fetchCourse(course.id)}
            />
          </div>

          {/* Documents Section */}
          <div className='space-y-4'>
            <h2 className='text-lg font-semibold'>Documents</h2>

            <div className='space-y-3 scroll-auto'>
              {course?.documents && course?.documents.length === 0 ? (
                <div className='text-sm text-muted-foreground'>
                  No documents uploaded.
                </div>
              ) : (
                <>
                  {sortDocuments((course?.documents ?? [])).map((doc) => (
                    <div
                      key={doc.id}
                      className='flex items-center justify-between p-3 bg-muted rounded-lg border border-border'
                    >
                      <div className='flex items-center gap-3'>
                        <FileText className='h-5 w-5 text-muted-foreground' />
                        <div>
                          <div className='text-sm font-medium text-foreground mb-2'>
                            {doc.title}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            Updated on {format(doc.updated_at, 'hh:mm a, dd MMM yy')}
                          </div>
                        </div>
                      </div>
                      <form action={formAction}>
                        <input type='hidden' name='documentId' value={doc.id} />
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-6 w-6 p-0 text-muted-foreground hover:text-foreground'
                          disabled={isPending}
                        >
                          {isPending ? '...' : <X className='h-4 w-4' />}
                        </Button>
                      </form>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
