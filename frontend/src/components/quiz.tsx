import React from 'react'

import {CourseWithDocuments} from '@/client'
import {getQuizzes} from '@/actions/quizzes'
import ErrorBox from '@/components/ui/ErrorBox'
import {Checkbox} from '@/components/ui/checkbox'
import {Label} from '@/components/ui/label'

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
      {result.data.map((quiz, idx) => (
        <div className='flex flex-col gap-6'>
          <p className='text-sm'>
            {idx + 1}. {quiz.quiz_text}
          </p>
          <ul>
            {quiz.choices.map((choice) => (
              <div className='flex gap-3 mb-4' key={choice.id}>
                <Checkbox id={choice.id} value={choice.id} />
                <Label htmlFor={choice.id} className='capitalize text-sm/snug'>{choice.text}</Label>
              </div>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
