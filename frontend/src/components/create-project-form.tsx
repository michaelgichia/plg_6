import {useActionState} from 'react'
import {redirect} from 'next/navigation'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {createCourse} from '@/actions/courses'

export function CreateProjectForm() {
  const [state, formAction, isPending] = useActionState(createCourse, {
    message: '',
    success: false,
    errors: {
      name: [],
      description: [],
    },
    course: undefined,
  })

  if(state?.success && state?.course) {
    redirect(`/dashboard/courses/${state.course.id}`)
  }

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='text-2xl font-semibold'>
          Create a new project
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {state?.success && state?.message && (
          <div className='mb-4 p-4 rounded-md bg-green-50 text-green-700'>
            {state.message}
          </div>
        )}
        {!state?.success && state?.message && (
          <div className='mb-4 p-4 rounded-md bg-red-50 text-red-700'>
            {state.message}
          </div>
        )}
        <form action={formAction} className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Project Title</Label>
            <Input
              id='name'
              name='name'
              placeholder="e.g., 'History of Ancient Rome'"
              className='w-full'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              name='description'
              placeholder='A brief summary of what this project is about.'
              className='min-h-[120px] resize-none'
            />
          </div>
          <div className='flex gap-3 pt-4'>
            <Button type='button' variant='secondary' className='flex-1' disabled={isPending}>
              Cancel
            </Button>
            <Button type='submit' className='flex-1' disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
