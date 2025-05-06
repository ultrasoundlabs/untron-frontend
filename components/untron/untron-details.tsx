import { motion } from "motion/react"
import { unitsToString } from "@/lib/units"

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
  const chainMap: Record<number, { name: string; explorer: string }> = { // TODO: needs to be better
    42161: { name: "Arbitrum", explorer: "https://arbiscan.io/tx/" },
    1: { name: "Ethereum", explorer: "https://etherscan.io/tx/" },
  }
  const toChainInfo = chainMap[toChain] ?? { name: `Chain ${toChain}`, explorer: "" }
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
          <span className="font-regular">Send total</span>
          <span className="font-medium text-foreground">{unitsToString(sentTotal)} {toCoin.toUpperCase()} TRC20</span>
        </div>
        <div className="flex justify-between">
          <span className="font-regular">Receive total</span>
          <span className="font-medium text-foreground">{unitsToString(receivedTotal)} {toCoin.toUpperCase()} {toChainInfo.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-regular">Receive address</span>
          <span className="font-medium text-foreground">{receiver.slice(0, 8)}...{receiver.slice(-6)}</span>
        </div>
        {sentTxHash && (
          <div className="flex justify-between">
            <span className="font-regular">Send transaction</span>
            <a
              href={`${toChainInfo.explorer}${sentTxHash}`}
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