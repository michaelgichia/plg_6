import {ChevronRight} from 'react-feather'
import {formatDate} from '@/lib/date'

import {getAttemptedQuizzes} from '@/actions/quizzes'
import ErrorBox from '@/components/ui/ErrorBox'

const getScoreBgColor = (percentage: number) => {
  if (percentage === 0) return 'bg-stone-200'
  if (percentage > 0 && percentage < 25) return 'bg-red-200'
  if (percentage >= 25 && percentage < 75) return 'bg-yellow-100'

  return 'bg-green-200'
}

export default async function QuizAttempts({courseId}: {courseId: string}) {
  const result = await getAttemptedQuizzes(courseId)

  if (!result.ok) {
    return <ErrorBox error={result.error} />
  }

  if (result.data.length === 0) {
    return (
      <div className='min-h-[200px] flex flex-col items-center justify-center'>
        <h2 className='mb-6 text-2xl font-semibold text-slate-900'>
          No quiz attempts yet
        </h2>
      </div>
    )
  }

  return (
    <div>
      <h2 className='mb-6 text-2xl font-semibold text-slate-900'>
        Quiz Attempts
      </h2>
      <div className='space-y-4'>
        {result.data.map((attempt, idx) => (
          <div
            key={attempt.id}
            className='flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 p-4 transition-colors hover:bg-stone-50 h-[74px]'
          >
            <div className='flex items-center gap-6'>
              <div className='font-medium text-slate-600'>#{idx + 1}</div>
              {!attempt.is_completed ? (
                <span className='py-1 px-1 rounded-md bg-yellow-200 font-semibold text-xs'>
                  In progress
                </span>
              ) : (
                <div
                  className={`rounded-lg px-4 py-2 font-semibold text-slate-900 ${getScoreBgColor(
                    attempt.score_percentage ?? 0,
                  )}`}
                >
                  {attempt.total_correct}/{attempt.total_submitted}
                </div>
              )}
              <div className='text-slate-600'>
                {formatDate(attempt.created_at)}
              </div>
            </div>
            <ChevronRight className='h-5 w-5 text-stone-400' />
          </div>
        ))}
      </div>
    </div>
  )
}
