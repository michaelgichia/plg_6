import {Gift, BarChart, Clock} from 'react-feather'
import ErrorBox from '@/components/ui/ErrorBox'
import {getQuizStats} from '@/actions/quizzes'

export default async function QuizStatsPage({courseId}: {courseId: string}) {
  const response = await getQuizStats(courseId)

  if (!response.ok) {
    return <ErrorBox error={response.error} />
  }
  const stats = response.data

  return (
    <div className='mb-8 grid gap-6 md:grid-cols-3'>
      {/* Best Score Card */}
      <div className='rounded-2xl border border-stone-200 bg-stone-50 p-6'>
        <div className='flex items-start gap-4'>
          <Gift className='h-6 w-6 text-slate-600' />
          <div>
            <div className='text-sm text-slate-600'>Best Score</div>
            <div className='mt-1 text-3xl font-semibold text-slate-900'>
              {stats.best_total_correct}{' '}
              <span className='text-xl text-slate-600'>
                /{stats.best_total_submitted}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Average Card */}
      <div className='rounded-2xl border border-stone-200 bg-stone-50 p-6'>
        <div className='flex items-start gap-4'>
          <BarChart className='h-6 w-6 text-slate-600' />
          <div>
            <div className='text-sm text-slate-600'>Average</div>
            <div className='mt-1 text-3xl font-semibold text-slate-900'>
              {stats.average_score}
              <span className='text-xl text-slate-600'>%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Attempts Card */}
      <div className='rounded-2xl border border-stone-200 bg-stone-50 p-6'>
        <div className='flex items-start gap-4'>
          <Clock className='h-6 w-6 text-slate-600' />
          <div>
            <div className='text-sm text-slate-600'>Total Attempts</div>
            <div className='mt-1 text-3xl font-semibold text-slate-900'>
              {stats.attempts}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
