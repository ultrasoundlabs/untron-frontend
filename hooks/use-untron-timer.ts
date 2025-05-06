import { useState, useEffect } from "react"

export function useUntronTimer(initialSeconds: number = 600) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds) // seconds remaining

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setTimeLeft(initialSeconds)
  }, [initialSeconds])

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return { timeLeft, setTimeLeft, formatTime }
} 