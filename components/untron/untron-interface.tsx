"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react"
import Header from "@/components/header"
import { useIsMobile } from "@/hooks/use-mobile"
import { motion, AnimatePresence } from "motion/react"
import { useUntronTimer } from "@/hooks/use-untron-timer"
import { useUntronCopy } from "@/hooks/use-untron-copy"
import { stringToUnits, convertSendToReceive, DEFAULT_DECIMALS } from "@/lib/units"
import { untronGet } from "@/lib/untron-api"
import { UntronExchange } from "@/components/untron/untron-exchange"
import { UntronDepositAddress } from "@/components/untron/untron-deposit-address"
import { UntronDetails } from "@/components/untron/untron-details"
import { UntronQrCode } from "@/components/untron/untron-qr-code"
import Footer from "@/components/footer"
import useSWR from "swr"
import { UntronSuccess } from "@/components/untron/untron-success"
import { UntronExpiry } from "@/components/untron/untron-expiry"

// Helper function to format address display
const formatAddress = (address: string, truncate = false): string => {
  if (!address) return "";
  if (!truncate || address.length <= 11) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const fetchOrder = async (id: string) => untronGet(id)

export default function UntronInterface({ orderId }: { orderId: string }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [showQrOnMobile, setShowQrOnMobile] = useState(false)
  const isMobile = useIsMobile()

  const { data: orderData, isLoading } = useSWR(orderId ?? null, fetchOrder, {
    refreshInterval: 3_000 // poll every 3s
  })

  // Debug log for orderData

  // Extract and transform data according to the new schema once it is available
  const transformed = orderData
    ? (() => {
        const od = orderData as any
        const receiver: string = (od.id as string).split("/")[0]

        const rateUnits: bigint = BigInt(od.meta.rate.ppm)
        const fromUnits = stringToUnits(od.from[0].amount, DEFAULT_DECIMALS)
        const receivedUnits = stringToUnits(od.state.received, DEFAULT_DECIMALS)
        const sentUnits = stringToUnits(od.state.sent, DEFAULT_DECIMALS)

        const remainingToSend: bigint = fromUnits - receivedUnits
        const expectedReceiveForRemaining: bigint = convertSendToReceive(remainingToSend, rateUnits)

        return {
          receiver,
          toChain: od.to.chain,
          toCoin: od.to.token.symbol.toLowerCase(),
          // Remaining / expected amounts (used while the order is in-progress)
          remainingToSend,
          expectedReceiveForRemaining,
          // Totals actually moved on-chain
          tronSentTotal: receivedUnits,
          destReceivedTotal: sentUnits,
          sentTxHash: od.txs?.close && od.txs.close.length > 0 ? od.txs.close[0].txHash : null,
          expiresAtS:
            od.order?.expiresAtS ??
            od.meta?.expiresAtS ??
            (od as any).expiresAt ??
            (od.createdAt ? Math.floor(Date.parse(od.createdAt) / 1000) + 600 : 0),
          status: od.status,
        }
      })()
    : null

  const initialSeconds = transformed
    ? Math.max(0, transformed.expiresAtS - Math.floor(Date.now() / 1000))
    : 600

  const { timeLeft, formatTime } = useUntronTimer(initialSeconds)

  const { copied, handleCopy } = useUntronCopy(transformed?.receiver ?? "")

  if (isLoading || !orderData) {
    return (
      <div className="min-h-screen bg-background font-geist flex flex-col">
        <Header />

        <main className="w-full max-w-[1200px] mx-auto px-4 py-12 flex flex-col lg:flex-row flex-grow animate-pulse">
          {/* Left Side */}
          <div className="w-full lg:w-3/5 pr-0 lg:pr-8 flex-shrink-0">
            {/* Header */}
            <div className="h-9 w-2/3 bg-muted-foreground/10 rounded-lg mb-2" />
            <div className="h-6 w-1/2 bg-muted-foreground/10 rounded-lg mb-7" />

            {/* Exchange */}
            <div className="w-full mb-[18px]">
              <div className="hidden sm:flex sm:flex-row sm:justify-start sm:items-center sm:gap-6">
                <div className="bg-muted-foreground/10 rounded-[36px] h-[84px] flex-1" />
                <div className="h-12 w-12 bg-muted-foreground/10 rounded-full" />
                <div className="bg-muted-foreground/10 rounded-[36px] h-[84px] flex-1" />
              </div>
              <div className="flex flex-col sm:hidden gap-4">
                <div className="flex items-center gap-0 w-full">
                  <div className="bg-muted-foreground/10 rounded-[36px] h-[84px] flex-1" />
                  <div className="h-12 w-12 bg-muted-foreground/10 rounded-full ml-0" />
                </div>
                <div className="bg-muted-foreground/10 rounded-[36px] h-[84px] w-full" />
              </div>
            </div>

            {/* Deposit Address */}
            <div className="mb-4 w-full">
              <div className="bg-muted-foreground/10 rounded-[22px] h-[80px] w-full" />
            </div>

            {/* Details Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-1/3 bg-muted-foreground/10 rounded-lg" />
              <div className="h-6 w-1/4 bg-muted-foreground/10 rounded-lg" />
            </div>

            {/* Details Box */}
            <div className="min-h-[110px] w-full bg-muted-foreground/10 rounded-lg" />
          </div>

          {/* Right Side */}
          <div className="w-full lg:w-2/5 flex-shrink-0 flex flex-col lg:items-end lg:pt-1 lg:pr-16">
            <div className="w-[294px] h-[294px] bg-muted-foreground/10 rounded-[48px]" />
            <div className="mt-[18px] text-center w-[302px] ml-[4px] space-y-2">
              <div className="h-9 w-1/2 mx-auto bg-muted-foreground/10 rounded-lg" />
              <div className="h-6 w-3/4 mx-auto bg-muted-foreground/10 rounded-lg" />
            </div>
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
  const beneficiary = (orderData as any)?.to?.beneficiary ?? null

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
              isMobile={isMobile}
            />
          ) : (
            <UntronSuccess
              sentTotal={tronSentTotal}
              receivedTotal={destReceivedTotal}
              toChain={toChain}
              toCoin={toCoin}
              sentTxHash={sentTxHash}
              receiver={receiver}
              isMobile={isMobile}
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
              className="w-full"
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
              className="w-full"
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
              className="w-full"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-muted-foreground text-[16px] font-regular">Recipient address: {formatAddress(beneficiary, true)}</div>
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
                  isMobile={isMobile}
                  order={{
                    sentTotal: remainingToSend,
                    receivedTotal: expectedReceiveForRemaining,
                    sentTxHash,
                    toCoin,
                    toChain,
                    receiver: beneficiary,
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