import { motion } from "motion/react"

interface UntronDetailsProps {
  isOpen: boolean
}

export function UntronDetails({ isOpen }: UntronDetailsProps) {
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
          <span className="font-regular">Fee (0,01%)</span>
          <span className="font-medium text-foreground">&lt;0,01 $</span>
        </div>
        <div className="flex justify-between">
          <span className="font-regular">Network cost</span>
          <span className="font-medium text-foreground">0,5 $</span>
        </div>
        <div className="flex justify-between">
          <span className="font-regular">Token contract</span>
          <span className="font-medium text-foreground">0x7AC7499f...51a78EC00</span>
        </div>
        <div className="flex justify-between">
          <span className="font-regular">Receive address</span>
          <span className="font-medium text-foreground">0xd208794A...77379452A</span>
        </div>
        <div className="flex justify-between">
          <span className="font-regular">Rate</span>
          <span className="font-medium text-foreground">1.00 USDT TRC20 = 0.997 USDT Arbitrum</span>
        </div>
      </div>
    </motion.div>
  )
} 