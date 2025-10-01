'use client'

import React, {useActionState} from 'react'
import {ChevronRight, Loader} from 'react-feather'

import {startQuizSession} from '@/actions/quizzes'

import {Button} from '@/components/ui/button'
import ErrorBox from '@/components/ui/ErrorBox'

export default function QuizStartComponent({courseId}: {courseId: string}) {
  const [state, formAction, isPending] = useActionState(startQuizSession, null)

  if(state && !state?.ok) {
    return <ErrorBox error={state?.error} />
  }

  return (
    <div className='flex justify-end'>
      <form action={formAction}>
        <input type='hidden' name='courseId' value={courseId} />
        <Button variant='default' type='submit' size='xl' disabled={isPending}>
          <span>Start Quiz</span>
          {isPending ? <Loader /> : <ChevronRight className='ml-2 h-6 w-6' />}
        </Button>
      </form>
    </div>
  )
}
