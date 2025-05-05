import type React from "react"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body className="font-geist">{children}</body>
    </html>
  )
}

export const metadata = {
  title: "Untron",
  description: "Untron cryptocurrency exchange",
}
