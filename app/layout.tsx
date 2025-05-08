import type React from "react"
import { Geist } from "next/font/google"
import "./globals.css"
import "@rainbow-me/rainbowkit/styles.css"
import { ThemeProvider } from "@/components/theme-provider"
import WalletProvider from "@/components/wallet-provider"

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
      <body className="font-geist bg-background">
        <ThemeProvider attribute="class" defaultTheme="white" enableSystem>
          <WalletProvider>{children}</WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
  title: "Untron",
  description: "Untron cryptocurrency exchange",
  icons: {
    icon: [
      { url: '/logos/shortLogo.svg' },
      { url: '/logos/shortLogo.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/logos/shortLogo.svg' }
    ]
  }
}
