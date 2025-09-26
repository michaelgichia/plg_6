'use client'

import { useState, useMemo } from 'react'
import {Search, Plus} from 'react-feather'
import Link from 'next/link'

import {Input} from '@/components/ui/input'
import CourseCard from '@/components/ui/course-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {Calendar} from '@/components/ui/calendar'
import { CourseWithOptionalDate, DatePreset } from '@/types/date'
import { inPreset, parseDate } from '@/lib/date'

export default function CoursesList({
  courses,
}: {
  courses: CourseWithOptionalDate[]
}) {
  const [query, setQuery] = useState('')
  const [datePreset, setDatePreset] = useState<DatePreset>('all')
  const [exactDate, setExactDate] = useState<Date | undefined>(undefined)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (courses ?? []).filter((c) => {
      const matchesQuery = !q
        ? true
        : [c.name, c.description ?? ''].some((v) =>
            v?.toLowerCase().includes(q),
          )

      const createdAt = parseDate((c as any).created_at)
      const matchesDate = createdAt
        ? inPreset(createdAt, datePreset, exactDate)
        : true

      return matchesQuery && matchesDate
    })
  }, [courses, query, datePreset, exactDate])



  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='flex items-center justify-between flex-wrap gap-3 mb-4'>
        <h2 className='text-2xl font-semibold'>My Courses</h2>
        <div className='flex items-center gap-3 w-full sm:w-auto'>
          <div className='relative w-full sm:w-80'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4' />
            <Input
              placeholder='Search courses...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className='pl-9'
            />
          </div>

          <Select
            value={datePreset}
            onValueChange={(val) => setDatePreset(val as DatePreset)}
          >
            <SelectTrigger>
              <SelectValue placeholder='Creation Date' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All dates</SelectItem>
              <SelectItem value='today'>Today</SelectItem>
              <SelectItem value='last7'>Last 7 days</SelectItem>
              <SelectItem value='last30'>Last 30 days</SelectItem>
              <SelectItem value='thisYear'>This year</SelectItem>
              <SelectItem value='on'>On…</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {datePreset === 'on' && (
        <div className='border rounded-xl p-3'>
          <Calendar
            mode='single'
            selected={exactDate}
            onSelect={(d) => setExactDate(d)}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-12 w-full h-full'>
          <p className='mb-4 text-lg text-muted-foreground'>
            No courses found.
          </p>
          <Link
            className='px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition flex'
            href='/dashboard/courses/create'
          >
            <Plus className='text-white text-sm' />
            <span className='text-white pl-6'>Add Course</span>
          </Link>
        </div>
      ) : (
        <div className='grid auto-rows-min gap-6 md:grid-cols-3 sm:grid-cols-3 lg:grid-cols-4'>
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
