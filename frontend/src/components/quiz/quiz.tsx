import dynamic from 'next/dynamic'
import React from 'react'

import {CourseWithDocuments} from '@/client'
import {getQuizzes} from '@/actions/quizzes'

import ErrorBox from '@/components/ui/ErrorBox'
import {Button} from '@/components/ui/button'
import PageLoader from '@/components/ui/page-loader'
import { ChevronRight } from 'react-feather'

const QuizStatsPage = dynamic(() => import('./quiz-stats'), {
  ssr: true,
  loading: () => <PageLoader />,
})
const QuizAttempts = dynamic(() => import('./quiz-attempts'), {
  ssr: true,
  loading: () => <PageLoader />,
})

export default async function QuizComponent({
  course,
}: {
  course: CourseWithDocuments
}) {
  const result = await getQuizzes(course.id)

  if (!result.ok) {
    return <ErrorBox error={result.error} />
  }

  return (
    <div className='h-full flex flex-col'>
      <div className='min-h-screen p-6'>
        <div className='mx-auto max-w-7xl'>
          {/* Stats Cards */}
          <QuizStatsPage courseId={course.id} />
          <div className='flex justify-end'>
            <form>
              <Button variant='default' type='submit' size='xl'>
                <span>Start Quiz</span>
                <ChevronRight className='ml-2 h-6 w-6' />
              </Button>
            </form>
          </div>
          {/* Quiz Attempts Section */}
          <QuizAttempts courseId={course.id} />
        </div>
      </div>
    </div>
  )
}
