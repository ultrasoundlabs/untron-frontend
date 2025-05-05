"use client"

import { useState } from "react"
import { ArrowRight, ChevronUp, ChevronDown, QrCode, X } from "lucide-react"
import Header from "@/components/header"
import SquareTimer from "@/components/square-timer"
import { useIsMobile } from "@/hooks/use-mobile"
import { motion, AnimatePresence } from "motion/react"
import { useUntronTimer } from "@/hooks/use-untron-timer"
import { useUntronCopy } from "@/hooks/use-untron-copy"
import { UntronExchange } from "@/components/untron/untron-exchange"
import { UntronDepositAddress } from "@/components/untron/untron-deposit-address"
import { UntronDetails } from "@/components/untron/untron-details"
import { UntronQrCode } from "@/components/untron/untron-qr-code"

export default function UntronInterface() {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [showQrOnMobile, setShowQrOnMobile] = useState(false)
  const isMobile = useIsMobile()
  const { timeLeft, formatTime } = useUntronTimer()
  const { copied, handleCopy } = useUntronCopy()

  return (
    <div className="min-h-screen bg-background font-geist">
      <Header />

      <main className="w-full max-w-[1200px] mx-auto px-4 py-12 flex flex-wrap">
        <div className="w-full lg:w-3/5 pr-0 lg:pr-8">
          <h1 className="text-3xl font-medium text-foreground flex items-center">
            Untroning
            {isMobile && (
              <span className="ml-2 text-3xl font-medium">- {formatTime()}</span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 mb-7">Send only TRC-20 USDT. Any other asset will be lost.</p>

          <UntronExchange />
          <UntronDepositAddress 
            copied={copied} 
            handleCopy={handleCopy} 
            isMobile={isMobile}
            onShowQr={() => setShowQrOnMobile(true)}
          />

          <div className="flex items-center justify-between mb-4">
            <div className="text-muted-foreground text-[16px] font-regular">Receive address: 0xd208794A...77379452A</div>
            <motion.button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="flex items-center text-muted-foreground text-[16px] font-regular"
              whileHover={{ color: "var(--foreground)" }}
            >
              Details {detailsOpen ? <ChevronUp className="w-[24px] h-[24px] ml-1" /> : <ChevronDown className="w-[24px] h-[24px] ml-1" />}
            </motion.button>
          </div>

          <UntronDetails isOpen={detailsOpen} />
        </div>

        <UntronQrCode 
          isMobile={isMobile} 
          timeLeft={timeLeft} 
          formatTime={formatTime}
          showQrOnMobile={showQrOnMobile}
          onCloseQr={() => setShowQrOnMobile(false)}
        />
      </main>
    </div>
  )
} 