'use client'

import {useActionState} from 'react'

import {Button} from '@/components/ui/button'
import {QuizPublic} from '@/client'
import {Checkbox} from '@/components/ui/checkbox'
import {Label} from '@/components/ui/label'
import {Separator} from '@/components/ui/separator'
import {submitQuizSession} from '@/actions/quizzes'
import ErrorBox from '@/components/ui/ErrorBox'

interface ActionState {
  ok: boolean
  message: string | null
  error: any | null
}

export default function QuizForm({
  quizzes,
  sessionId,
}: {
  quizzes: QuizPublic[]
  sessionId: string
}) {
  const [state, submitAction] = useActionState<ActionState, FormData>(
    submitQuizSession as any,
    {
      ok: false,
      message: null,
      error: null,
    },
  )

  const isQuizInError = (quizId: string) => {
    return state.error && state.error.field === `choice-${quizId}`
  }

  const getErrorMessage = (quizId: string) => {
    return isQuizInError(quizId) ? state.error?.message : null
  }

  return (
    <>
      <form action={submitAction}>
        <div className='h-full flex flex-col'>
          <input type='hidden' name='sessionId' value={sessionId} />
          {quizzes.map((quiz) => {
            const errorMessage = getErrorMessage(quiz.id)
            const errorClass = errorMessage
              ? 'border-l-4 border-red-500 pl-4 bg-red-50'
              : ''

            return (
              <div
                className={`flex flex-col gap-6 mb-8 p-4 ${errorClass}`}
                key={quiz.id}
              >
                <p className='text-lg'>{quiz.quiz_text}</p>

                <input type='hidden' name='quizId' value={quiz.id} />

                {errorMessage && (
                  <p className='text-sm text-red-600 font-medium'>
                    {errorMessage}
                  </p>
                )}

                <ul className={errorMessage ? 'text-red-600' : ''}>
                  {quiz.choices.map((choice) => (
                    <div className='flex gap-3 mb-4' key={choice.id}>
                      <Checkbox
                        id={choice.id}
                        value={choice.id}
                        name={`choice-${quiz.id}`}
                      />
                      <Label htmlFor={choice.id}>
                        <span className='capitalize text-sm/snug'>
                          {choice.text}
                        </span>
                      </Label>
                    </div>
                  ))}
                </ul>
                <Separator />
              </div>
            )
          })}
          {!state.ok && state.error && state.error.code !== 'VALIDATION' && (
            <ErrorBox error={state.error} />
          )}
        </div>
        <Button type='submit'>Submit Answers</Button>
      </form>
    </>
  )
}
