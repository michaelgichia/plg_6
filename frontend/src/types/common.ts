export type IState = {
  errors?: {
    name?: string[]
    description?: string[]
  }
  message?: string | null
  success: boolean | null
  course?: CoursePublic
}