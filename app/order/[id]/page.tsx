"use client"

import UntronInterface from "@/components/untron/untron-interface"
import { useParams } from 'next/navigation'

export default function OrderPage() {
  const params = useParams()
  const id = params.id as string

  // Now you can use the id parameter
  console.log('Order ID:', id)
  
  return <UntronInterface orderId={id} />
}