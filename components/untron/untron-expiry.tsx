import { Link } from "lucide-react"
import { UntronExchange } from "@/components/untron/untron-exchange"
import { UntronDetails } from "@/components/untron/untron-details"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"

interface UntronExpiryProps {
  sentTotal: bigint
  receivedTotal: bigint
  toChain: number
  toCoin: string
  sentTxHash: string
  receiver: string
}

export function UntronExpiry({ sentTotal, receivedTotal, toChain, toCoin, sentTxHash, receiver }: UntronExpiryProps) {
  const router = useRouter()

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center gap-3 text-foreground mb-6">
        <h2 className="text-3xl font-medium">Order expired</h2>
        <img src="/emoji/Warning.png" alt="Warning" className="w-8 h-8" />
      </div>

      <div className="w-full flex flex-row gap-8">
        {/* Left Column */}
        <div className="w-1/2 flex flex-col">
          <UntronExchange
            sentTotal={sentTotal}
            receivedTotal={receivedTotal}
            toChain={toChain}
            toCoin={toCoin}
          />

          <div className="w-full">
            <UntronDetails
              isOpen={true}
              order={{
                sentTotal,
                receivedTotal,
                sentTxHash,
                toCoin,
                toChain,
                receiver,
              }}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="w-1/2 flex flex-col items-center justify-center">
          <div className="bg-muted/50 p-6 rounded-lg space-y-4 max-w-md">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <p className="text-foreground leading-relaxed">
                The order has expired because no funds were sent to the Tron address before the deadline.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Link className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
              <p className="text-foreground leading-relaxed">
                <span className="font-medium text-red-500">Important:</span> Do not send funds to this Tron address any longer. The system will not process them.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 8v4l3 3" />
              </svg>
              <p className="text-foreground leading-relaxed">
                Please create a new order if you'd like to proceed with the exchange.
              </p>
            </div>
          </div>

          <motion.button
            onClick={() => router.push('/')}
            className="bg-primary text-primary-foreground text-[16px] font-medium px-6 py-2 rounded-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Home
          </motion.button>
        </div>
      </div>
    </div>
  )
} 