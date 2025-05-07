'use client'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <button
      type="button"
      aria-label="Theme toggle disabled"
      disabled
      className="p-2 rounded-full bg-secondary/50 cursor-not-allowed transition-colors focus:outline-none"
    >
      <Sun className="w-5 h-5 text-muted-foreground" />
    </button>
  )
} 