import {Gift, BarChart, Clock, ChevronRight} from 'react-feather'

  const getScoreBgColor = (score: number, total: number) => {
    if (total === 0) return "bg-stone-200"
    if (score === 0) return "bg-yellow-100"
    if (score === total) return "bg-green-200"
    return "bg-green-200"
  }

export default function QuizStatsPage() {
  const quizAttempts = [
    { id: 6, score: 0, total: 0, date: "30/09/2025, 12:25" },
    { id: 5, score: 0, total: 4, date: "30/09/2025, 12:24" },
    { id: 4, score: 0, total: 4, date: "30/09/2025, 11:12" },
    { id: 3, score: 0, total: 4, date: "30/09/2025, 06:02" },
    { id: 2, score: 0, total: 4, date: "24/09/2025, 13:01" },
    { id: 1, score: 3, total: 4, date: "24/09/2025, 12:55" },
  ]

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
        <div>
          <h2 className="mb-6 text-2xl font-semibold text-slate-900">Quiz Attempts</h2>
          <div className="space-y-4">
            {quizAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 p-6 transition-colors hover:bg-stone-50"
              >
                <div className="flex items-center gap-6">
                  <div className="text-lg font-medium text-slate-600">#{attempt.id}</div>
                  <div
                    className={`rounded-lg px-4 py-2 text-base font-semibold text-slate-900 ${getScoreBgColor(
                      attempt.score,
                      attempt.total,
                    )}`}
                  >
                    {attempt.score}/{attempt.total}
                  </div>
                  <div className="text-base text-slate-600">{attempt.date}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-stone-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

