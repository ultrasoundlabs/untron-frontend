import { motion } from "motion/react"
import { unitsToString } from "@/lib/units"
import { OUTPUT_CHAINS } from "@/config/chains"
import { useIsMobile } from "@/hooks/use-mobile"

// Helper function to format address display
const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface UntronDetailsProps {
  isOpen: boolean
  isMobile: boolean
  order: {
    sentTotal: bigint
    receivedTotal: bigint
    sentTxHash: string
    toCoin: string
    fromCoin: string
    toChain: number
    receiver: string
  }
}

export function UntronDetails({ isOpen, isMobile, order }: UntronDetailsProps) {
  const { sentTotal, receivedTotal, sentTxHash, toCoin, fromCoin, toChain, receiver } = order
  const chainMap: Record<number, { name: string; icon: string; fixedFeeUsd: bigint }> = OUTPUT_CHAINS.reduce((acc, c) => {
    acc[c.id] = { name: c.name, icon: c.icon, fixedFeeUsd: c.fixedFeeUsd }
    return acc
  }, {} as Record<number, { name: string; icon: string; fixedFeeUsd: bigint }>)

  const toChainInfo = chainMap[toChain] ?? { name: `Chain ${toChain}`, icon: "/chains/Arbitrum.svg" }
  
  const explorerUrl = toChain === 10 
    ? `https://optimistic.etherscan.io/tx/${sentTxHash}` 
    : `https://basescan.org/tx/${sentTxHash}`

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
          <span className="font-medium text-foreground">{unitsToString(sentTotal)} {fromCoin.toUpperCase()} TRC-20</span>
        </div>
        <div className="flex justify-between">
          <span className="font-regular">Amount to receive</span>
          <span className="font-medium text-foreground">{unitsToString(receivedTotal - toChainInfo.fixedFeeUsd)} {toCoin.toUpperCase()} {toChainInfo.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-regular">Recipient address</span>
          <span className="font-medium text-foreground">{isMobile ? formatAddress(receiver) : receiver}</span>
        </div>
        {sentTxHash && (
          <div className="flex justify-between">
            <span className="font-regular">Funds released</span>
            <a
              href={explorerUrl}
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