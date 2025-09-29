export type APIError = {
  code: string // e.g. "BAD_REQUEST", "NOT_FOUND", "INTERNAL"
  message: string // human-friendly message
  status?: number // optional HTTP status code
  details?: string // optional machine-friendly details (validation errors, etc)
}

export type Ok<T> = {ok: true; data: T}
export type Err = {ok: false; error: APIError}

export type Result<T> = Ok<T> | Err
