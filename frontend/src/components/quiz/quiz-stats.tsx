import {Gift, BarChart, Clock} from 'react-feather'
import QuizAttempts from './quiz-attempts'

export default function QuizStatsPage({ courseId }: { courseId: string }) {

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {/* Best Score Card */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
            <div className="flex items-start gap-4">
              <Gift className="h-6 w-6 text-slate-600" />
              <div>
                <div className="text-sm text-slate-600">Best Score</div>
                <div className="mt-1 text-3xl font-semibold text-slate-900">
                  4 <span className="text-xl text-slate-600">/4</span>
                </div>
              </div>
            </div>
          </div>

          {/* Average Card */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
            <div className="flex items-start gap-4">
              <BarChart className="h-6 w-6 text-slate-600" />
              <div>
                <div className="text-sm text-slate-600">Average</div>
                <div className="mt-1 text-3xl font-semibold text-slate-900">
                  NaN<span className="text-xl text-slate-600">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Attempts Card */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
            <div className="flex items-start gap-4">
              <Clock className="h-6 w-6 text-slate-600" />
              <div>
                <div className="text-sm text-slate-600">Total Attempts</div>
                <div className="mt-1 text-3xl font-semibold text-slate-900">6</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Attempts Section */}
        <QuizAttempts courseId={courseId} />
      </div>
    </div>
  )
}

