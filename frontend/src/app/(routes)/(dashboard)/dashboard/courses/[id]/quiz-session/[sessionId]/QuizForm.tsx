'use client'

import {useActionState, useEffect, useMemo, useState} from 'react'

import {Button} from '@/components/ui/button'
import {QuizSessionPublicWithResults, QuizAttemptPublic} from '@/client'
import {Checkbox} from '@/components/ui/checkbox'
import {Label} from '@/components/ui/label'
import {submitQuizSession} from '@/actions/quizzes'
import ErrorBox from '@/components/ui/ErrorBox'
import {getQuizSession} from '@/lib/quizzes'
import {toast} from 'sonner'
import {useRouter} from 'next/navigation'
import {ChevronLeft} from 'react-feather'

const CORRECT_COLOR = 'bg-green-50 border-green-500'
const INCORRECT_COLOR = 'bg-red-50 border-red-500'
const DEFAULT_COLOR = 'border-gray-200'

interface ActionState {
  ok: boolean
  message: string | null
  error: any | null
}

export default function QuizForm({sessionId}: {sessionId: string}) {
  const [isLoading, setIsLoading] = useState(false)
  const [session, setSession] = useState<QuizSessionPublicWithResults>()
  const router = useRouter()

  const fetchQuizSession = async (_id: string, _sessionId: string) => {
    try {
      const result = await getQuizSession(_id, _sessionId)
      if (result.ok) {
        setSession(result.data)
      } else {
        toast.error('Failed to fetch course details. Please try again.')
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const handleOnSubmit = (_state: any, formData: FormData) => {
    submitQuizSession(state, formData)
      .then(() => {
        fetchQuizSession(id, sessionId)
      })
      .catch(() => {
        toast.error('Failed to delete document. Please try again.')
      })
  }

  const [state, submitAction] = useActionState<ActionState, FormData>(
    handleOnSubmit as any,
    {
      ok: false,
      message: null,
      error: null,
    },
  )

  useEffect(() => {
    setIsLoading(true)
    fetchQuizSession(id, sessionId)
  }, [id, sessionId])

  const resultsMap = useMemo(() => {
    if (!session) return {}
    const {is_completed, results} = session
    if (!is_completed || !results) return {}
    return results.reduce((map, result) => {
      map[result.quiz_id] = result
      return map
    }, {} as Record<string, QuizAttemptPublic>)
  }, [session])

  if (isLoading) {
    return (
      <div className='p-4'>
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) return null
  const {is_completed, quizzes} = session

  const isQuizInError = (quizId: string) => {
    return state && state?.error && state?.error.field === `choice-${quizId}`
  }

  const getErrorMessage = (quizId: string) => {
    return isQuizInError(quizId) ? state.error?.message : null
  }

  if (!session?.quizzes || session?.quizzes.length === 0) {
    return (
      <p className='text-center text-gray-500'>
        No quizzes found for this session.
      </p>
    )
  }

  const handleOnBack = () => {
    router.back()
  }

  return (
    <>
      <form action={submitAction}>
        <div className='h-full flex flex-col'>
          <input type='hidden' name='sessionId' value={sessionId} />

          {is_completed && (
            <div className='p-6 mb-8 rounded-lg bg-blue-50 border border-blue-200'>
              <h2 className='text-xl font-bold text-blue-800'>
                Quiz Completed!
              </h2>
              <p className='mt-2 text-blue-700'>
                You answered {session.total_correct} out of{' '}
                {session.total_submitted} questions correctly.
              </p>
              {session.score_percentage !== null && (
                <p className='text-blue-700 font-semibold'>
                  Score: {session.score_percentage?.toFixed(1)}%
                </p>
              )}
            </div>
          )}

          {(quizzes ?? []).map((quiz) => {
            const result = resultsMap[quiz.id]
            const isScored = is_completed && result

            let itemClass = DEFAULT_COLOR
            if (isScored) {
              itemClass = result.is_correct ? CORRECT_COLOR : INCORRECT_COLOR
            }

            const errorMessage = getErrorMessage(quiz.id)
            const errorClass = errorMessage
              ? 'border-l-4 border-red-500 pl-4 bg-red-50'
              : ''

            const questionTextStyle = result?.is_correct
              ? 'font-semibold text-green-700'
              : 'text-lg'

            return (
              <div
                className={`flex flex-col gap-4 mb-8 p-4 border rounded-md ${itemClass} ${errorClass}`}
                key={quiz.id}
              >
                <p className={`text-lg ${questionTextStyle}`}>
                  {quiz.quiz_text}
                </p>
                <input type='hidden' name='quizId' value={quiz.id} />
                {errorMessage && (
                  <p className='text-sm text-red-600 font-medium'>
                    {errorMessage}
                  </p>
                )}

                <ul>
                  {quiz.choices.map((choice) => {
                    let checkboxProps: Record<string, any> = {
                      id: choice.id,
                      value: choice.text,
                      name: `choice-${quiz.id}`,
                      disabled: isScored,
                    }

                    let labelClass = 'text-sm/snug'
                    if (isScored) {
                      const isSelected =
                        result.selected_answer_text === choice.text
                      const isCorrectAnswer =
                        result.correct_answer_text === choice.text

                      checkboxProps.checked = isSelected

                      if (isCorrectAnswer) {
                        labelClass = 'font-bold text-green-700'
                      } else if (isSelected && !result.is_correct) {
                        labelClass = 'font-bold text-red-700 line-through'
                      }
                    }

                    return (
                      <div
                        className='flex gap-3 [&:not(:last-child)]:mb-4'
                        key={choice.id}
                      >
                        <Checkbox {...checkboxProps} />
                        <Label htmlFor={choice.text}>
                          <span className={labelClass}>{choice.text}</span>
                        </Label>
                      </div>
                    )
                  })}
                </ul>

                {isScored && (
                  <div className='pt-2 mt-2 border-t border-gray-200'>
                    <p
                      className={`text-sm font-semibold ${
                        result.is_correct ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {result.is_correct
                        ? 'Result: Correct'
                        : `Result: Incorrect (The correct answer was: ${result.correct_answer_text})`}
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {state &&
            !state.ok &&
            state.error &&
            state.error.code !== 'VALIDATION' && (
              <ErrorBox error={state.error} />
            )}

          {state &&
            !state.ok &&
            state.error &&
            state.error.field === 'submissions' && (
              <ErrorBox error={state.error} />
            )}
        </div>

        <div className='flex gap-4'>
          <Button
            type='button'
            variant='outline'
            className='min-w-[120px]'
            onClick={handleOnBack}
          >
            <ChevronLeft /> Back
          </Button>
          {!is_completed && <Button type='submit'>Submit Answers</Button>}

          {is_completed && <Button disabled>Quiz Session Completed</Button>}
        </div>
      </form>
    </>
  )
}
