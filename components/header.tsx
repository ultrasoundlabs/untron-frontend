'use client'
import Image from "next/image"
import Link from "next/link"
import { Globe } from "lucide-react"
import ThemeToggle from "@/components/theme-toggle"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function Header() {
  return (
    <header className="w-full max-w-[1200px] mx-auto px-4 py-6 flex justify-between items-center">
      <div className="flex items-center space-x-8">
        <Link href="/" className="flex items-center">
          <Image src="/logos/shortLogo.svg" alt="Untron Logo" width={58} height={58} className="mr-2 w-[58px] h-[58px]" />
        </Link>
        <nav className="hidden md:flex space-x-6">
          <Link href="https://x.com/alexhooketh/status/1882052401869574527" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-accent-foreground transition-colors">
            Untron Yourself
          </Link>
          <Link href="https://t.me/untronchat" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-accent-foreground transition-colors">
            Integrate
          </Link>
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <button className="flex items-center font-medium text-foreground bg-card rounded-full px-3 py-1.5">
          <Globe className="w-5 h-5 mr-1" />
          <span>Eng</span>
        </button>
        <ConnectButton />
      </div>
    </header>
  )
} 