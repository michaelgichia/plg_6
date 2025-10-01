import {getQuizSession} from '@/actions/quizzes'
import ErrorBox from '@/components/ui/ErrorBox'
import QuizForm from './QuizForm'

export default async function Page(props: {
  params: {id: string; sessionId: string}
}) {
  const params = await props.params
  const sessionId = params.sessionId

  const result = await getQuizSession(sessionId)

  if (!result.ok) {
    return <ErrorBox error={result.error} />
  }

  const quizzes = result.data.quizzes || []

  return (
    <div className='min-h-screen p-6 border-r border-stone-200'>
      <div className='mx-auto max-w-7xl'>
        <QuizForm quizzes={quizzes} sessionId={sessionId} />
      </div>
    </div>
  )
}