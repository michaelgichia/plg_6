import { CoursePublic } from '@/client'

export type CourseWithOptionalDate = CoursePublic & {created_at?: string | null}
export type DatePreset = 'all' | 'today' | 'last7' | 'last30' | 'thisYear' | 'on'
