// components/quizzes/QuizAnswerOption.tsx
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { QuizAttemptPublic } from '@/client'

interface QuizAnswerOptionProps {
  choice: { id: string; text: string }
  quizId: string
  isScored: boolean
  result: QuizAttemptPublic | undefined
}

export function QuizAnswerOption({
  choice,
  quizId,
  isScored,
  result,
}: QuizAnswerOptionProps) {
  let checkboxProps: Record<string, any> = {
    id: choice.text,
    value: choice.text,
    name: `choice-${quizId}`,
    disabled: isScored,
  }

  let labelClass = 'text-sm/snug capitalize'

  if (isScored && result) {
    const isSelected = result.selected_answer_text === choice.text
    const isCorrectAnswer = result.correct_answer_text === choice.text

    if (isScored) {
        checkboxProps.checked = isSelected
    }

    if (isCorrectAnswer) {
      labelClass = 'font-bold text-green-700'
    } else if (isSelected && !result.is_correct) {
      labelClass = 'font-bold text-red-700 line-through'
    }
  }

  return (
    <div className='flex gap-3 [&:not(:last-child)]:mb-4'>
      <Checkbox {...checkboxProps} />
      {/* Label htmlFor must match Checkbox id */}
      <Label htmlFor={choice.text}>
        <span className={labelClass}>{choice.text}</span>
      </Label>
    </div>
  )
}