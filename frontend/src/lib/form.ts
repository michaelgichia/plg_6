import {emailPattern} from './auth'

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
