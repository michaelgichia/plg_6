import { APIError } from '@/lib/result'
import { isAxiosError } from 'axios'

export function mapApiError(err: unknown): APIError {
  if (isAxiosError(err)) {
    return {
      code: err.response?.status ? `HTTP_${err.response.status}` : 'AXIOS_ERROR',
      message: err.response?.data?.message || err.message,
      status: err.response?.status,
      details: err.response?.data ?? err.toJSON(),
    }
  }

  return {
    code: 'UNKNOWN',
    message: (err as Error)?.message ?? 'Unknown error',
  }
}
