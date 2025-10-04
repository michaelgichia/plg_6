import { SingleQuizSubmission } from '@/client';
import { RawSubmissionsData } from '@/types/form';

/**
 * Get quiz form values for submission to the backend.
 */
export function extractRawSubmissions(formData: FormData): RawSubmissionsData {
  const sessionId = (formData.get('sessionId') as string) || '';
  const submittedQuizIds = formData.getAll('quizId') as string[];

  const submissions: SingleQuizSubmission[] = submittedQuizIds.map(quizId => {
    return {
      quiz_id: quizId,
      selected_answer_text: formData.get(`choice-${quizId}`) as string,
    };
  });

  return {
    sessionId,
    submissions,
  };
}
