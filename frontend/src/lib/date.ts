import { DatePreset } from '@/types/date'

export function parseDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export function inPreset(date: Date, preset: DatePreset, onDate?: Date): boolean {
  const now = new Date()
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const a = startOfDay(date)

  switch (preset) {
    case 'all':
      return true
    case 'today': {
      const t = startOfDay(now)
      return a.getTime() === t.getTime()
    }
    case 'last7': {
      const from = new Date(now)
      from.setDate(from.getDate() - 7)
      return a >= startOfDay(from)
    }
    case 'last30': {
      const from = new Date(now)
      from.setDate(from.getDate() - 30)
      return a >= startOfDay(from)
    }
    case 'thisYear': {
      return date.getFullYear() === now.getFullYear()
    }
    case 'on': {
      if (!onDate) return true
      const t = startOfDay(onDate)
      return a.getTime() === t.getTime()
    }
    default:
      return true
  }
}

export function formatDate(input?: string | null) {
  if (!input) return '—'
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
