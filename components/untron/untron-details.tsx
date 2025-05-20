import { motion } from "motion/react"
import { unitsToString } from "@/lib/units"
import { OUTPUT_CHAINS } from "@/config/chains"

interface UntronDetailsProps {
  isOpen: boolean
  order: {
    sentTotal: bigint
    receivedTotal: bigint
    sentTxHash: string
    toCoin: string
    toChain: number
    receiver: string
  }
}

export function UntronDetails({ isOpen, order }: UntronDetailsProps) {
  const { sentTotal, receivedTotal, sentTxHash, toCoin, toChain, receiver } = order
  const chainMap: Record<number, { name: string; icon: string; fixedFeeUsd: bigint }> = OUTPUT_CHAINS.reduce((acc, c) => {
    acc[c.id] = { name: c.name, icon: c.icon, fixedFeeUsd: c.fixedFeeUsd }
    return acc
  }, {} as Record<number, { name: string; icon: string; fixedFeeUsd: bigint }>)

  const toChainInfo = chainMap[toChain] ?? { name: `Chain ${toChain}`, icon: "/chains/Arbitrum.svg" }
  
  return (
    <motion.div 
      className="rounded-md mb-4"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? "auto" : 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.13 }}
    >
      <div className="flex flex-col gap-[5px] text-[16px] text-muted-foreground">
        <div className="flex justify-between">
          <span className="font-regular">Amount to send</span>
          <span className="font-medium text-foreground">{unitsToString(sentTotal)} {toCoin.toUpperCase()} TRC-20</span>
        </div>
        <div className="flex justify-between">
          <span className="font-regular">Amount to receive</span>
          <span className="font-medium text-foreground">{unitsToString(receivedTotal - toChainInfo.fixedFeeUsd)} {toCoin.toUpperCase()} {toChainInfo.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-regular">Send TRC-20 to</span>
          <span className="font-medium text-foreground">{receiver.slice(0, 8)}...{receiver.slice(-6)}</span>
        </div>
        {sentTxHash && (
          <div className="flex justify-between">
            <span className="font-regular">Funds released</span>
            <a
              href={`https://optimistic.etherscan.io/tx/${sentTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline"
            >
              View
            </a>
          </div>
        )}
      </div>
    </motion.div>
  )
} 