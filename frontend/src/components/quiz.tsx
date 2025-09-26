
import React from 'react'

import { CourseWithDocuments } from '@/client'
import { getQuizzes } from '@/actions/quizzes'
import ErrorBox from '@/components/ui/ErrorBox'


export default async function QuizComponent({ course }: { course: CourseWithDocuments }) {
    const result = await getQuizzes(course.id)

  if (!result.ok) {
    return <ErrorBox error={result.error} />
  }

  return (
    <div className='h-full flex flex-col'>
      {result.data.map((quiz, idx) => (
        <div>
          <p> {idx + 1}. {quiz.quiz_text}</p>
          <ul>
            {quiz.choices.map((choice) => (
              <li key={choice.id}>{choice.text}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    )
  }
