import { ArrowRight } from "lucide-react"
import { unitsToString } from "@/lib/units"
import { OUTPUT_CHAINS } from "@/config/chains"

interface UntronExchangeProps {
  sentTotal: bigint
  receivedTotal: bigint
  toChain: number
  toCoin: string
}

export function UntronExchange({ sentTotal, receivedTotal, toChain, toCoin }: UntronExchangeProps) {
  // map chain id to display name and icon path
  const chainMap: Record<number, { name: string; icon: string }> = OUTPUT_CHAINS.reduce((acc, c) => {
    acc[c.id] = { name: c.name, icon: c.icon }
    return acc
  }, {} as Record<number, { name: string; icon: string }>)

  const toChainInfo = chainMap[toChain] ?? { name: `Chain ${toChain}`, icon: "/chains/Arbitrum.svg" }

  // Format amount to 3 decimal places
  const formatAmount = (amount: bigint) => {
    const fullAmount = unitsToString(amount)
    const [intPart, fracPart = ""] = fullAmount.split(".")
    return fracPart ? `${intPart}.${fracPart.slice(0, 3)}` : intPart
  }

  return (
    <div className="flex items-center justify-between mb-[18px] space-x-0 flex-wrap sm:flex-nowrap gap-4 sm:gap-0">
      <div className="bg-card rounded-[36px] py-[14px] pl-4 pr-8 flex items-center min-w-fit">
        <div className="w-12 h-12 mr-4 flex-shrink-0">
          <img src="/chains/Tron.svg" alt="Tron Logo" className="w-full h-full" />
        </div>
        <div className="flex flex-col -space-y-1 overflow-hidden min-w-0">
          <div className="text-[18px] text-muted-foreground font-regular truncate">Send Tron</div>
          <div className="text-[36px] font-semibold text-foreground truncate">{formatAmount(sentTotal)} {toCoin.toUpperCase()}</div>
        </div>
      </div>

      <button className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
        <ArrowRight className="w-6 h-6 text-primary-foreground" />
      </button>

      <div className="bg-card rounded-[36px] py-[14px] pl-4 pr-8 flex items-center min-w-fit">
        <div className="w-12 h-12 mr-4 flex-shrink-0">
          <img src={toChainInfo.icon} alt={`${toChainInfo.name} Logo`} className="w-full h-full" />
        </div>
        <div className="flex flex-col -space-y-1 overflow-hidden min-w-0">
          <div className="text-[18px] text-muted-foreground font-regular truncate">Receive {toChainInfo.name}</div>
          <div className="text-[36px] font-semibold text-foreground truncate">{formatAmount(receivedTotal)} {toCoin.toUpperCase()}</div>
        </div>
      </div>
    </div>
  )
} 