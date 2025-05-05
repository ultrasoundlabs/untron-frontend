import { useState } from "react"

export function useUntronCopy() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText("TU1fnjgPk3sWvZxKUGtfc8JJzbdSrwagZk")
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return { copied, handleCopy }
} 