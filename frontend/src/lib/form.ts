import { RawSubmissionsData, ValidationError } from '@/types/form'
import { emailPattern, namePattern } from './auth'

export function validateField(name: string, value: string) {
  let error = ''

  switch (name) {
    case 'email':
      if (!value) {
        error = 'Email is required'
      } else if (!emailPattern.value.test(value)) {
        error = emailPattern.message
      }
      break
    case 'password':
      if (!value) {
        error = 'Password is required'
      } else if (value.length < 8) {
        error = 'Password must be at least 8 characters'
      }
      break
  }

  return error
}

export function validateSignUpFields(
  name: string,
  value: string,
  password?: string,
) {
  let error = ''

  switch (name) {
    case 'full_name':
      if (!value) {
        error = 'Name is required'
      } else if (value.length < 3) {
        error = 'Name must be at least 3 characters'
      } else if (!namePattern.value.test(value)) {
        error = namePattern.message
      }
      break
    case 'email':
      if (!value) {
        error = 'Email is required'
      } else if (!emailPattern.value.test(value)) {
        error = emailPattern.message
      }
      break
    case 'password':
      if (!value) {
        error = 'Password is required'
      } else if (value.length < 8) {
        error = 'Password must be at least 8 characters'
      }
      break
    case 'confirm_password':
      if (!value) {
        error = 'Password confirmation is required'
      } else if (value !== password) {
        error = 'The passwords do not match'
      }
      break
  }

  return error
}

/**
 * Validate quiz submission form
 */
export function validateSubmissions(
  raw: RawSubmissionsData,
): ValidationError[]{

  if (!raw.sessionId) {
    return [{
      ok: false,
      error: {
        code: 'VALIDATION',
        type: 'Validation',
        message: 'Session ID is missing from the form data.',
        field: 'sessionId',
      },
    }];
  }

  if(!raw.submissions || raw.submissions.length === 0) {
    return [{
      ok: false,
      error: {
        code: 'VALIDATION',
        type: 'Submission',
        message: 'No submissions found in the form data.',
        field: 'submissions',
      },
    }];
  }

  const submissionErrors: ValidationError[] = []

  for(const submission of raw.submissions) {
    if (!submission.selected_answer_text || submission.selected_answer_text.length === 0) {
      submissionErrors.push({
        ok: false,
        error: {
          code: 'VALIDATION',
          type: 'Validation',
          message: `This quiz requires at least one answer.`,
          field: `choice-${submission.quiz_id}`,
        },
      })
    }
  }

  return submissionErrors
}