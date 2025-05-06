import { useState } from "react"

export function useUntronCopy(text: string) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return { copied, handleCopy }
} 