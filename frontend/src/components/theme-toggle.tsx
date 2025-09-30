'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from "react-feather"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        setTheme(savedTheme)
      }
    }
  }, [mounted, setTheme])

  useEffect(() => {
    if (mounted && theme) {
      localStorage.setItem('theme', theme)
    }
  }, [mounted, theme])

  if (!mounted) {
    return null
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className='capitalize p-2 flex items-center w-full text-left cursor-pointer hover:text-foreground'
    >
      <span className='mr-2 text-sm'>{theme}</span> {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  )
}