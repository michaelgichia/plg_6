import {getQuizSession} from '@/actions/quizzes'

import {Separator} from '@/components/ui/separator'
import {Checkbox} from '@/components/ui/checkbox'
import {Label} from '@/components/ui/label'
import ErrorBox from '@/components/ui/ErrorBox'

export default async function Page(props: {params: Promise<{id: string, sessionId: string}>}) {
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
        <div className='h-full flex flex-col'>
          {quizzes.map((quiz) => (
            <div className='flex flex-col gap-6 mb-8' key={quiz.id}>
              <p className='text-lg'>{quiz.quiz_text}</p>
              <ul>
                {quiz.choices.map((choice) => (
                  <div className='flex gap-3 mb-4' key={choice.id}>
                    <Checkbox id={choice.id} value={choice.id} />
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
          ))}
        </div>
      </div>
    </div>
  )
}
