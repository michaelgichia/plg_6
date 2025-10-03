import {useActionState, useEffect, useMemo, useState} from 'react'
import {submitQuizSession} from '@/actions/quizzes'
import {getQuizSession} from '@/lib/quizzes'
import {toast} from 'sonner'
import {QuizAttemptPublic, QuizSessionPublicWithResults} from '@/client'
import { mapApiError } from '@/lib/mapApiError'

interface ActionState {
  ok: boolean
  message: string | null
  error: any | null
}

export const useQuizSession = (courseId: string, sessionId: string) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [session, setSession] = useState<QuizSessionPublicWithResults | null>(null)

  const COLORS = {
      CORRECT: 'bg-green-50 border-green-500',
      INCORRECT: 'bg-red-50 border-red-500',
      DEFAULT: 'border-gray-200',
  }

  const fetchQuizSession = async () => {
    setIsLoading(true)
    try {
      const result = await getQuizSession(courseId, sessionId)
      if (result.ok) {
        setSession(result.data)
      } else {
        toast.error('Failed to fetch quiz session. Please try again.')
      }
    } catch (error) {
      toast.error('An unexpected error occurred during fetch.')
    } finally {
      setIsLoading(false)
      setIsSubmitting(false)
    }
  }

  const handleOnSubmit = (_state: any, formData: FormData) => {
    setIsSubmitting(true)
    return submitQuizSession(_state, formData)
      .then(async (result) => {
        await fetchQuizSession()
        return result
      })
      .catch((e) => {
        toast.error('Failed to submit answers.')
        return { ok: false, error: mapApiError(e) };
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  const [actionState, submitAction] = useActionState<ActionState, FormData>(
    handleOnSubmit as any,
    { ok: false, message: null, error: null } as ActionState,
  )

  useEffect(() => {
    fetchQuizSession()
  }, [courseId, sessionId])

  const resultsMap = useMemo(() => {
    if (!session || !session.is_completed || !session.results) return {}
    return session.results.reduce((map, result) => {
      map[result.quiz_id] = result
      return map
    }, {} as Record<string, QuizAttemptPublic>)
  }, [session])

  return {
    session,
    isLoading,
    isSubmitting,
    actionState,
    submitAction,
    resultsMap,
    COLORS,
  }
}
