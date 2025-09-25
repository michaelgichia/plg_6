import {APIError} from '@/lib/result'
import {get} from '@/utils'
import {isAxiosError} from 'axios'

export function mapApiError(err: unknown): APIError {
  if (isAxiosError(err)) {
    return {
      code: err.response?.status
        ? `HTTP_${err.response.status}`
        : 'AXIOS_ERROR',
      message:
        get(err, 'response.data.detail') ??
        get(err, 'response.error.response.data') ??
        'Something went wrong',
      status: err.response?.status,
      details: get(err, 'response.data') ??
        get(err, 'response.error.response.data') ??
        'Something went wrong',
    }
  }

  return {
    code: 'UNKNOWN',
    message: (err as Error)?.message ?? 'Unknown error',
  }
}
