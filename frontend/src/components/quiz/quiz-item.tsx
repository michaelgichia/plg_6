import { QuizAttemptPublic, QuizPublic } from '@/client'
import { QuizAnswerOption } from './quiz-answer-option'

interface QuizItemProps {
  quiz: QuizPublic
  isCompleted: boolean
  result: QuizAttemptPublic | undefined
  resultsMap: Record<string, QuizAttemptPublic>
  getErrorMessage: (quizId: string) => string | null
  COLORS: { CORRECT: string; INCORRECT: string; DEFAULT: string }
}

export function QuizItem({
  quiz,
  isCompleted,
  result,
  getErrorMessage,
  COLORS,
}: QuizItemProps) {
  const isScored = isCompleted && result
  const errorMessage = getErrorMessage(quiz.id)

  let itemClass = COLORS.DEFAULT
  if (isScored) {
    itemClass = result.is_correct ? COLORS.CORRECT : COLORS.INCORRECT
  }

  const errorClass = errorMessage
    ? 'border-l-4 border-red-500 pl-4 bg-red-50'
    : ''

  const questionTextStyle = result?.is_correct
    ? 'font-semibold text-green-700'
    : 'text-lg'

  return (
    <div
      className={`flex flex-col gap-4 mb-8 p-4 border rounded-md ${itemClass} ${errorClass}`}
      key={quiz.id}
    >
      <p className={`text-lg ${questionTextStyle}`}>{quiz.quiz_text}</p>
      <input type='hidden' name='quizId' value={quiz.id} />

      {errorMessage && (
        <p className='text-sm text-red-600 font-medium'>{errorMessage}</p>
      )}

      <ul>
        {quiz.choices.map((choice) => (
          <QuizAnswerOption
            key={choice.id}
            choice={choice}
            quizId={quiz.id}
            isScored={isScored}
            result={result}
          />
        ))}
      </ul>

      {isScored && (
        <div className='pt-2 mt-2 border-t border-gray-200'>
          <p
            className={`text-sm font-semibold ${
              result.is_correct ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {result.is_correct
              ? 'Result: Correct'
              : `Result: Incorrect (The correct answer was: ${result.correct_answer_text})`}
          </p>
        </div>
      )}
    </div>
  )
}
