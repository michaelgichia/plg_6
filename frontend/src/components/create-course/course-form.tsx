import {useActionState} from 'react'
import {useRouter} from 'next/navigation'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'

import {createCourse} from '@/actions/courses'

export function CourseForm() {
  const router = useRouter()
  const [_state, formAction, isPending] = useActionState(createCourse, {
    message: '',
    success: false,
  })


  function handleGoBack() {
    router.back()
  }

  return (
    <form action={formAction} className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='name'>Course Title</Label>
        <Input
          id='name'
          name='name'
          placeholder="e.g., 'History of Ancient Rome'"
          className='w-full'
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description'>Description</Label>
        <Textarea
          id='description'
          name='description'
          placeholder='A brief summary of what this course is about.'
          className='min-h-[120px] resize-none'
          required
        />
      </div>
      <div className='flex gap-3 pt-4'>
        <Button
          type='button'
          variant='secondary'
          className='flex-1'
          disabled={isPending}
          onClick={handleGoBack}
        >
          Cancel
        </Button>
        <Button type='submit' className='flex-1' disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Course'}
        </Button>
      </div>
    </form>
  )
}

export default CourseForm
