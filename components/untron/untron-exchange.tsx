import { ArrowRight } from "lucide-react"
import { unitsToString } from "@/lib/units"

interface UntronExchangeProps {
  sentTotal: bigint
  receivedTotal: bigint
  toChain: number
  toCoin: string
}

export function UntronExchange({ sentTotal, receivedTotal, toChain, toCoin }: UntronExchangeProps) {
  // map chain id to display name and icon path
  const chainMap: Record<number, { name: string; icon: string }> = {
    42161: { name: "Arbitrum", icon: "/Arbitrum.svg" },
    1: { name: "Ethereum", icon: "/ethereum.svg" },
    // extend as needed
  }
  const toChainInfo = chainMap[toChain] ?? { name: `Chain ${toChain}`, icon: "/Arbitrum.svg" }

  return (
    <div className="flex items-center justify-between mb-[18px] space-x-0 flex-wrap sm:flex-nowrap gap-4 sm:gap-0">
      <div className="bg-card rounded-[36px] py-[14px] pl-4 pr-8 flex items-center flex-1 min-w-[200px] w-full sm:w-auto">
        <div className="w-12 h-12 mr-4 flex-shrink-0">
          <img src="/tron.svg" alt="Tron Logo" className="w-full h-full" />
        </div>
        <div className="flex flex-col -space-y-1 overflow-hidden">
          <div className="text-[18px] text-muted-foreground font-regular truncate">Send Tron</div>
          <div className="text-[36px] font-semibold text-foreground truncate">{unitsToString(sentTotal)} {toCoin.toUpperCase()}</div>
        </div>
      </div>

      <button className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
        <ArrowRight className="w-6 h-6 text-primary-foreground" />
      </button>

      <div className="bg-card rounded-[36px] py-[14px] pl-4 pr-8 flex items-center flex-1 min-w-[200px] w-full sm:w-auto">
        <div className="w-12 h-12 mr-4 flex-shrink-0">
          <img src={toChainInfo.icon} alt={`${toChainInfo.name} Logo`} className="w-full h-full" />
        </div>
        <div className="flex flex-col -space-y-1 overflow-hidden">
          <div className="text-[18px] text-muted-foreground font-regular truncate">Receive {toChainInfo.name}</div>
          <div className="text-[36px] font-semibold text-foreground truncate">{unitsToString(receivedTotal)} {toCoin.toUpperCase()}</div>
        </div>
      </div>
    </div>
  )
} 