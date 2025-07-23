import { CheckCircle2 } from "lucide-react"
import { UntronExchange } from "@/components/untron/untron-exchange"
import { UntronDetails } from "@/components/untron/untron-details"

interface UntronSuccessProps {
  sentTotal: bigint
  receivedTotal: bigint
  toChain: number
  toCoin: string
  fromCoin: string
  sentTxHash: string
  receiver: string
  isMobile: boolean
}

export function UntronSuccess({ sentTotal, receivedTotal, toChain, toCoin, fromCoin, sentTxHash, receiver, isMobile }: UntronSuccessProps) {
  return (
    <div className="w-full flex flex-col items-center text-center">
      <div className="flex items-center text-foreground mb-6">
        <CheckCircle2 className="w-8 h-8 text-green-500 mr-2" />
        <h2 className="text-3xl font-medium">Order complete</h2>
      </div>

      <UntronExchange
        sentTotal={sentTotal}
        receivedTotal={receivedTotal}
        toChain={toChain}
        toCoin={toCoin}
        fromCoin={fromCoin}
      />

      <div className="max-w-lg w-full">
        <UntronDetails
          isOpen={true}
          isMobile={isMobile}
          order={{
            sentTotal,
            receivedTotal,
            sentTxHash,
            toCoin,
            fromCoin,
            toChain,
            receiver,
          }}
        />
      </div>
    </div>
  )
} 