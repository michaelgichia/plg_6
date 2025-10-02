'use client'

import {Button} from '@/components/ui/button'
import ErrorBox from '@/components/ui/ErrorBox'
import {useQuizSession} from '@/hooks/useQuizSession'
import {useRouter} from 'next/navigation'
import {ChevronLeft, Loader} from 'react-feather'
import {QuizItem} from '@/components/quiz/quiz-item'

export default function QuizForm({
  sessionId,
  courseId,
}: {
  sessionId: string
  courseId: string
}) {
  const router = useRouter()
  const {
    session,
    isLoading,
    isSubmitting,
    actionState,
    submitAction,
    resultsMap,
    COLORS,
  } = useQuizSession(courseId, sessionId)

  const isQuizInError = (quizId: string) => {
    return actionState && actionState.error && actionState.error.field === `choice-${quizId}`
  }

  const getErrorMessage = (quizId: string) => {
    return isQuizInError(quizId) ? actionState.error?.message : null
  }

  const handleOnBack = () => {
    router.push(`/dashboard/courses/${courseId}?tab=quiz`)
  }

  if (isLoading) {
    return (
      <div className='p-4'>
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) return null
  const {is_completed, quizzes} = session

  if (!quizzes || quizzes.length === 0) {
    return (
      <p className='text-center text-gray-500'>
        No quizzes found for this session.
      </p>
    )
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

          {/* Quiz List (Orchestration using QuizItem presentation) */}
          {(quizzes ?? []).map((quiz) => (
            <QuizItem
              key={quiz.id}
              quiz={quiz}
              isCompleted={is_completed}
              result={resultsMap[quiz.id]}
              resultsMap={resultsMap}
              getErrorMessage={getErrorMessage}
              COLORS={COLORS}
            />
          ))}

          {/* Top-level Error Handling */}
          {actionState &&
            !actionState.ok &&
            actionState.error &&
            actionState.error.code !== 'VALIDATION' && (
              <ErrorBox error={actionState.error} />
            )}
        </div>

        {/* Action Buttons */}
        <div className='flex gap-4 mt-8'>
          <Button
            type='button'
            variant='outline'
            className='min-w-[120px]'
            onClick={handleOnBack}
          >
            <ChevronLeft /> Back
          </Button>
          {isSubmitting ? (
            <Button disabled>
              <Loader className='animate-spin' />
              Submitting Answers...
            </Button>
          ) : (
            <>
              {!is_completed && (
                <Button type='submit'>Submit Answers</Button>
              )}
              {is_completed && (
                <Button disabled>Quiz Session Completed</Button>
              )}
            </>
          )}
        </div>
      </form>
    </>
  )
}