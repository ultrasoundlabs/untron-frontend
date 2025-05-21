"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react"
import Header from "@/components/header"
import { useIsMobile } from "@/hooks/use-mobile"
import { motion, AnimatePresence } from "motion/react"
import { useUntronTimer } from "@/hooks/use-untron-timer"
import { useUntronCopy } from "@/hooks/use-untron-copy"
import { convertSendToReceive } from "@/lib/units"
import { UntronExchange } from "@/components/untron/untron-exchange"
import { UntronDepositAddress } from "@/components/untron/untron-deposit-address"
import { UntronDetails } from "@/components/untron/untron-details"
import { UntronQrCode } from "@/components/untron/untron-qr-code"
import Footer from "@/components/footer"
import useSWR from "swr"
import { UntronSuccess } from "@/components/untron/untron-success"
import { UntronExpiry } from "@/components/untron/untron-expiry"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`)
  }
  const data = await res.json()
  if (data.error) {
    throw new Error(data.error)
  }
  return data
}

export default function UntronInterface({ orderId }: { orderId: string }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [showQrOnMobile, setShowQrOnMobile] = useState(false)
  const isMobile = useIsMobile()

  const { data: orderData, isLoading } = useSWR(orderId ? `https://untron.finance/api/v2/order/${orderId}` : null, fetcher, {
    refreshInterval: 3_000 // poll every 3s
  })

  // Debug log for orderData

  // Extract and transform data according to the new schema once it is available
  const transformed = orderData
    ? (() => {
        // All numeric values coming from the backend are integers, so we can safely use normal JS numbers
        const {
          order: { receiver, fromAmount, rate, toChain, toCoin, expiresAtS },
          state: { receivedTotal: tronSentTotal, sentTotal: destReceivedTotal, sentTxHash, sentAtS },
          status
        } = orderData as {
          order: {
            receiver: string
            fromAmount: number
            rate: number
            toChain: number
            toCoin: string
            expiresAtS: number
          }
          state: {
            receivedTotal: number
            sentTotal: number
            sentTxHash: string
            sentAtS: number
            expiresAtS: number
          }
          status: string
        }

        // Amount still left to send on Tron side
        const remainingToSend: bigint = BigInt(fromAmount) - BigInt(tronSentTotal)

        // Amount the user would receive on the destination chain for what is still left to send
        const expectedReceiveForRemaining: bigint = convertSendToReceive(BigInt(fromAmount), BigInt(rate))

        return {
          receiver,
          toChain,
          toCoin,
          // Remaining / expected amounts (used while the order is in-progress)
          remainingToSend,
          expectedReceiveForRemaining,
          // Totals that were actually moved on-chain (used once the order is closed)
          tronSentTotal: BigInt(tronSentTotal), // how much the user actually sent to Tron
          destReceivedTotal: BigInt(destReceivedTotal ?? 0), // how much was released on the destination chain
          sentTxHash,
          sentAtS,
          expiresAtS,
          status,
        }
      })()
    : null

  const initialSeconds = transformed
    ? Math.max(0, transformed.expiresAtS - Math.floor(Date.now() / 1000))
    : 600

  const { timeLeft, formatTime } = useUntronTimer(initialSeconds)

  const { copied, handleCopy } = useUntronCopy(transformed?.receiver ?? "")

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-geist flex flex-col">
        <Header />
        <main className="w-full max-w-[1200px] mx-auto px-4 py-12 flex flex-col flex-grow items-center justify-center">
          <div className="text-muted-foreground flex items-center gap-2">
            {/* <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading...</span> */}
          </div>
        </main>
        <motion.div 
          className="mt-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.2 }}
        >
          <Footer />
        </motion.div>
      </div>
    )
  }

  if (!transformed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">No order data found.</div>
    )
  }

  if ((orderData as any)?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error: {(orderData as any).error}
      </div>
    )
  }

  // destructure values from the transformed object
  const {
    receiver,
    // in-progress amounts
    remainingToSend,
    expectedReceiveForRemaining,
    // finished order totals
    tronSentTotal,
    destReceivedTotal,
    toChain,
    toCoin,
    sentTxHash,
    status,
  } = transformed
  const beneficiary = (orderData as any)?.order?.beneficiary ?? null // beneficiary from new schema

  const showSuccess = status === "closed"

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background font-geist flex flex-col">
        <Header />
        <main className="w-full max-w-[1200px] mx-auto px-4 py-12 flex flex-col flex-grow items-center justify-center">
          {status === "closed" && destReceivedTotal === BigInt(0) ? (
            <UntronExpiry
              sentTotal={tronSentTotal}
              receivedTotal={destReceivedTotal}
              toChain={toChain}
              toCoin={toCoin}
              sentTxHash={sentTxHash}
              receiver={receiver}
            />
          ) : (
            <UntronSuccess
              sentTotal={tronSentTotal}
              receivedTotal={destReceivedTotal}
              toChain={toChain}
              toCoin={toCoin}
              sentTxHash={sentTxHash}
              receiver={receiver}
            />
          )}
        </main>
        <motion.div 
          className="mt-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.2 }}
        >
          <Footer />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-geist flex flex-col">
      <Header />
      
      <main className="w-full max-w-[1200px] mx-auto px-4 py-12 flex flex-col lg:flex-row flex-grow">
        <div className="w-full lg:w-3/5 pr-0 lg:pr-8 flex-shrink-0">
          <AnimatePresence>
            <motion.div
              key="header"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-medium text-foreground flex items-center">
                Untronning 🤫
                {isMobile && (
                  <span className="ml-2 text-3xl font-medium">- {formatTime()}</span>
                )}
              </h1>
              <p className="text-muted-foreground mt-1 mb-7">Send only TRC-20 USDT. Any other asset will be lost.</p>
            </motion.div>

            <motion.div
              key="exchange"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <UntronExchange 
                sentTotal={remainingToSend}
                receivedTotal={expectedReceiveForRemaining}
                toChain={toChain}
                toCoin={toCoin}
              />
            </motion.div>

            <motion.div
              key="deposit"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <UntronDepositAddress 
                copied={copied} 
                handleCopy={handleCopy} 
                isMobile={isMobile}
                onShowQr={() => setShowQrOnMobile(true)}
                depositAddress={receiver}
              />
            </motion.div>

            <motion.div
              key="details"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-muted-foreground text-[16px] font-regular">Recipient address: {beneficiary}</div>
                <motion.button
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  className="flex items-center text-muted-foreground text-[16px] font-regular"
                  whileHover={{ color: "var(--foreground)" }}
                >
                  Details {detailsOpen ? <ChevronUp className="w-[24px] h-[24px] ml-1" /> : <ChevronDown className="w-[24px] h-[24px] ml-1" />}
                </motion.button>
              </div>

              <div className="min-h-[110px]">
                <UntronDetails
                  isOpen={detailsOpen}
                  order={{
                    sentTotal: remainingToSend,
                    receivedTotal: expectedReceiveForRemaining,
                    sentTxHash,
                    toCoin,
                    toChain,
                    receiver,
                  }}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          className="w-full lg:w-2/5 flex-shrink-0"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <UntronQrCode 
            isMobile={isMobile} 
            timeLeft={timeLeft} 
            formatTime={formatTime}
            // totalTime={initialSeconds}
            showQrOnMobile={showQrOnMobile}
            onCloseQr={() => setShowQrOnMobile(false)}
            depositAddress={receiver}
          />
        </motion.div>
      </main>

      <motion.div 
        className="mt-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 1.2 }}
      >
        <Footer />
      </motion.div>
    </div>
  )
} 