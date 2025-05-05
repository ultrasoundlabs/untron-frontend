"use client"

import UntronInterface from "@/untron-ui"

interface OrderPageProps {
  params: {
    id: string
  }
}

export default function OrderPage({ params }: OrderPageProps) {
  // The id can be used later when real logic is implemented.
  // For now we just render the swap interface.
  return <UntronInterface />
} 