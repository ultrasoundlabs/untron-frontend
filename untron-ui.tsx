"use client"

import { useState, useEffect } from "react"
import { ArrowRight, ChevronUp, ChevronDown, QrCode, X } from "lucide-react"
import Image from "next/image"
import Header from "@/components/header"
import SquareTimer from "@/components/square-timer"
import { useIsMobile } from "@/hooks/use-mobile"
import { motion, AnimatePresence } from "motion/react"

export default function UntronInterface() {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [progress, setProgress] = useState(100) // 100% progress
  const isMobile = useIsMobile()
  const [showQrOnMobile, setShowQrOnMobile] = useState(false)

  // Define the color of the border depending on the remaining time
  const getProgressColor = () => {
    if (timeLeft < 60) return "var(--timer-red)" // Red, if less than a minute left
    if (timeLeft < 240) return "var(--timer-orange)" // Orange, if less than 4 minutes left
    return "var(--timer-green)" // Green
  }

  const handleCopy = () => {
    navigator.clipboard.writeText("TU1fnjgPk3sWvZxKUGtfc8JJzbdSrwagZk")
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  // Format time as mm:ss
  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background font-geist">
      {/* Navigation Bar */}
      <Header />

      {/* Main Content */}
      <main className="w-full max-w-[1200px] mx-auto px-4 py-12 flex flex-wrap">
        <div className="w-full lg:w-3/5 pr-0 lg:pr-8">
          <h1 className="text-3xl font-medium text-foreground flex items-center">
            Untroning
            {isMobile && (
              <span className="ml-2 text-3xl font-medium">- {formatTime()}</span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 mb-7">Send only TRC-20 USDT. Any other asset will be lost.</p>

          {/* Currency Exchange */}
          <div className="flex items-center justify-between mb-[18px] space-x-0 flex-wrap sm:flex-nowrap gap-4 sm:gap-0">
            <div className="bg-card rounded-[36px] py-[14px] pl-4 pr-8 flex items-center flex-1 min-w-[200px] w-full sm:w-auto">
              <div className="w-12 h-12 mr-4 flex-shrink-0">
                <img src="/tron.svg" alt="Tron Logo" className="w-full h-full" />
              </div>
              <div className="flex flex-col -space-y-1 overflow-hidden">
                <div className="text-[18px] text-muted-foreground font-regular truncate">Send Tron</div>
                <div className="text-[36px] font-semibold text-foreground truncate">509 USDT</div>
              </div>
            </div>

            <button className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
              <ArrowRight className="w-6 h-6 text-primary-foreground" />
            </button>

            <div className="bg-card rounded-[36px] py-[14px] pl-4 pr-8 flex items-center flex-1 min-w-[200px] w-full sm:w-auto">
              <div className="w-12 h-12 mr-4 flex-shrink-0">
                <img src="/Arbitrum.svg" alt="Arbitrum Logo" className="w-full h-full" />
              </div>
              <div className="flex flex-col -space-y-1 overflow-hidden">
                <div className="text-[18px] text-muted-foreground font-regular truncate">Receive Arbitrum</div>
                <div className="text-[36px] font-semibold text-foreground truncate">508 USDT</div>
              </div>
            </div>
          </div>

          {/* Deposit Address */}
          <div className="mb-4 w-full">
            <div className="bg-card rounded-[22px] py-3 px-4 w-full">
              <div className="text-[18px] text-muted-foreground font-regular mb-[0px]">Deposit address</div>
              <div className="flex items-center justify-between w-full flex-wrap sm:flex-nowrap gap-2 sm:gap-0">
                <div className="text-[18px] font-medium text-foreground truncate pr-2 w-full sm:w-auto">TU1fnjgPk3sWvZxKUGtfc8JJzbdSrwagZk</div>
                <div className="flex-shrink-0 ml-auto sm:ml-0 flex gap-2">
                  <motion.button 
                    onClick={handleCopy} 
                    className="bg-primary text-primary-foreground text-[16px] font-medium px-3 py-1 rounded-full"
                    whileHover={{ 
                      width: "auto",
                      scale: 1.05,
                      originX: 1
                    }}
                    whileTap={{ 
                      scale: 0.9,
                      originX: 1
                    }}
                    animate={{ 
                      backgroundColor: copied ? "var(--muted-foreground)" : "var(--primary)",
                      color: copied ? "var(--muted)" : "var(--primary-foreground)",
                      width: "auto",
                      transition: { 
                        duration: 0.15,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </motion.button>
                  {isMobile && (
                    <motion.button 
                      onClick={() => setShowQrOnMobile(true)} 
                      className="bg-primary text-primary-foreground text-[16px] font-medium px-3 py-1 rounded-full flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      Show QR
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Receive Address */}
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

          {/* Details Panel (hidden by default) */}
          <AnimatePresence>
            {detailsOpen && (
              <motion.div 
                className="rounded-md mb-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.13 }}
              >
                <div className="flex flex-col gap-[5px] text-[16px] text-muted-foreground">
                  <div className="flex justify-between">
                    <span className="font-regular">Fee (0,01%)</span>
                    <span className="font-medium text-foreground">&lt;0,01 $</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-regular">Network cost</span>
                    <span className="font-medium text-foreground">0,5 $</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-regular">Token contract</span>
                    <span className="font-medium text-foreground">0x7AC7499f...51a78EC00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-regular">Receive address</span>
                    <span className="font-medium text-foreground">0xd208794A...77379452A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-regular">Rate</span>
                    <span className="font-medium text-foreground">1.00 USDT TRC20 = 0.997 USDT Arbitrum</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* QR Code and Timer */}
        <div className="w-full lg:w-2/5 flex flex-col lg:items-end lg:pt-1">
          {!isMobile && (
            <>
          <SquareTimer 
            total={600} 
            currentTime={timeLeft} 
            onTimeChange={setTimeLeft}
            size={294}
            stroke={8}
          >
            <div className="w-[202px] h-[202px]">
              <img src="/qr-code.svg" alt="QR Code" className="w-full h-full" />
            </div>
          </SquareTimer>

          <div className="mt-[18px] text-center w-[302px] ml-[4px]">
            <div className="text-[30px] font-medium">{formatTime()}</div>
            <div className="mt-[2px] text-[16px] font-regular text-muted-foreground">Waiting for transfer...</div>
          </div>
            </>
          )}
        </div>
      </main>

      {/* Mobile QR Code Modal */}
      <AnimatePresence>
        {isMobile && showQrOnMobile && (
          <motion.div 
            className="fixed inset-0 bg-primary/70 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div 
              className="bg-card rounded-[48px] w-[320px]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex flex-col items-start w-full px-[32px]">
                <div className="w-full py-[14px] pt-[20px] flex justify-between items-center">
                  <h3 className="text-[24px] font-medium text-foreground font-geist">QR Code</h3>
                  <motion.button 
                    onClick={() => setShowQrOnMobile(false)}
                    className="w-[32px] h-[32px] flex items-center justify-center rounded-full bg-muted"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-6 h-6" strokeWidth={2.5} />
                  </motion.button>
                </div>
                <div className="pb-[32px] flex flex-col items-center w-full">
                  <SquareTimer 
                    total={600} 
                    currentTime={timeLeft} 
                    onTimeChange={setTimeLeft}
                    size={250}
                    stroke={8}
                  >
                    <div className="w-[170px] h-[170px]">
                      <img src="/qr-code.svg" alt="QR Code" className="w-full h-full" />
                    </div>
                  </SquareTimer>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
