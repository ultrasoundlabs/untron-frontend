import { ArrowRight } from "lucide-react"
import { unitsToString } from "@/lib/units"
import { OUTPUT_CHAINS } from "@/config/chains"
import { motion } from "motion/react"

interface UntronExchangeProps {
  sentTotal: bigint
  receivedTotal: bigint
  toChain: number
  toCoin: string
  fromCoin: string
}

export function UntronExchange({ sentTotal, receivedTotal, toChain, toCoin, fromCoin }: UntronExchangeProps) {
  // map chain id to display name and icon path
  const chainMap: Record<number, { name: string; icon: string; fixedFeeUsd: bigint }> = OUTPUT_CHAINS.reduce((acc, c) => {
    acc[c.id] = { name: c.name, icon: c.icon, fixedFeeUsd: c.fixedFeeUsd }
    return acc
  }, {} as Record<number, { name: string; icon: string; fixedFeeUsd: bigint }>)

  const toChainInfo = chainMap[toChain] ?? { name: `Chain ${toChain}`, icon: "/chains/Arbitrum.svg" }

  // Format amount with different rounding modes
  const formatAmount = (amount: bigint, roundingMode: 'ceil' | 'floor') => {
    const fullAmount = unitsToString(amount)
    const [intPart, fracPart = ""] = fullAmount.split(".")
    
    // If fraction part is too short, pad with zeros
    const paddedFrac = fracPart.padEnd(2, '0')
    
    if (roundingMode === 'ceil') {
      // Round UP to 2 decimal places
      if (fracPart.length > 2 && fracPart[2] !== '0') {
        // If there's a 3rd digit and it's not zero, add 0.01
        const secondDigit = parseInt(paddedFrac[1]) + 1
        if (secondDigit === 10) {
          // Carry over to first digit
          const firstDigit = parseInt(paddedFrac[0]) + 1
          if (firstDigit === 10) {
            // Carry over to integer part
            return `${parseInt(intPart) + 1}`
          }
          return `${intPart}.${firstDigit}0`
        }
        return `${intPart}.${paddedFrac[0]}${secondDigit}`
      }
    }
    
    // Round DOWN (floor) or no rounding needed
    return fracPart ? `${intPart}.${paddedFrac.slice(0, 2)}` : intPart
  }

  return (
    <div className="w-full mb-[18px]">
      {/* Desktop layout: all in one row */}
      <div className="hidden sm:flex sm:flex-row sm:justify-center sm:items-center sm:gap-6">
        <motion.div
          key="send"
          className="bg-card rounded-[36px] py-[14px] pl-4 pr-8 flex items-center w-auto"
        >
          <div className="w-12 h-12 mr-4 flex-shrink-0">
            <img src="/chains/Tron.svg" alt="Tron Logo" className="w-full h-full" />
          </div>
          <div className="flex flex-col -space-y-1 overflow-hidden min-w-0 text-left">
            <div className="text-[18px] text-muted-foreground font-regular">Send Tron</div>
            <div className="text-[36px] font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis">{formatAmount(sentTotal, 'ceil')} {fromCoin.toUpperCase()}</div>
          </div>
        </motion.div>

        <div className="flex justify-center">
          <button 
            aria-label="swap direction"
            className="h-12 w-12 bg-primary rounded-full flex items-center justify-center shrink-0"
          >
            <ArrowRight className="w-6 h-6 text-primary-foreground" />
          </button>
        </div>

        <motion.div
          key="receive"
          className="bg-card rounded-[36px] py-[14px] pl-4 pr-8 flex items-center w-auto"
        >
          <div className="w-12 h-12 mr-4 flex-shrink-0">
            <img src={toChainInfo.icon} alt={`${toChainInfo.name} Logo`} className="w-full h-full" />
          </div>
          <div className="flex flex-col -space-y-1 overflow-hidden min-w-0 text-left">
            <div className="text-[18px] text-muted-foreground font-regular truncate">Receive {toChainInfo.name}</div>
            <div className="text-[36px] font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis">{formatAmount(receivedTotal - toChainInfo.fixedFeeUsd, 'floor')} {toCoin.toUpperCase()}</div>
          </div>
        </motion.div>
      </div>

             {/* Mobile layout: Send + Arrow in one row, Receive below */}
       <div className="flex flex-col sm:hidden gap-4">
         <div className="flex items-center gap-0 w-full">
           <motion.div
             key="send-mobile"
             className="bg-card rounded-[36px] py-[14px] pl-4 pr-8 flex items-center flex-1"
           >
             <div className="w-12 h-12 mr-4 flex-shrink-0">
               <img src="/chains/Tron.svg" alt="Tron Logo" className="w-full h-full" />
             </div>
             <div className="flex flex-col -space-y-1 overflow-hidden min-w-0 text-left">
               <div className="text-[18px] text-muted-foreground font-regular">Send Tron</div>
               <div className="text-[36px] font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis">{formatAmount(sentTotal, 'ceil')} {fromCoin.toUpperCase()}</div>
             </div>
           </motion.div>

           <div className="flex justify-center ml-0">
             <button 
               aria-label="swap direction"
               className="h-12 w-12 bg-primary rounded-full flex items-center justify-center shrink-0"
             >
               <ArrowRight className="w-6 h-6 text-primary-foreground" />
             </button>
           </div>
         </div>

         <motion.div
           key="receive-mobile"
           className="bg-card rounded-[36px] py-[14px] pl-4 pr-8 flex items-center w-full"
         >
           <div className="w-12 h-12 mr-4 flex-shrink-0">
             <img src={toChainInfo.icon} alt={`${toChainInfo.name} Logo`} className="w-full h-full" />
           </div>
           <div className="flex flex-col -space-y-1 overflow-hidden min-w-0 text-left">
             <div className="text-[18px] text-muted-foreground font-regular truncate">Receive {toChainInfo.name}</div>
             <div className="text-[36px] font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis">{formatAmount(receivedTotal - toChainInfo.fixedFeeUsd, 'floor')} {toCoin.toUpperCase()}</div>
           </div>
         </motion.div>
       </div>
    </div>
  )
} 