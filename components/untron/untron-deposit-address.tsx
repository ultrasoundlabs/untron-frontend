import { QrCode } from "lucide-react"
import { motion } from "motion/react"

interface UntronDepositAddressProps {
  copied: boolean
  handleCopy: () => void
  isMobile: boolean
  onShowQr: () => void
}

export function UntronDepositAddress({ copied, handleCopy, isMobile, onShowQr }: UntronDepositAddressProps) {
  return (
    <div className="mb-4 w-full">
      <div className="bg-card rounded-[22px] py-3 px-4 w-full">
        <div className="text-[18px] text-muted-foreground font-regular mb-[0px]">Deposit address</div>
        <div className="flex items-center justify-between w-full flex-wrap sm:flex-nowrap gap-2 sm:gap-0">
          <div className="text-[18px] font-medium text-foreground truncate pr-2 w-full sm:w-auto">
            TU1fnjgPk3sWvZxKUGtfc8JJzbdSrwagZk
          </div>
          <div className="flex-shrink-0 ml-auto sm:ml-0 flex gap-2">
            <motion.button 
              onClick={handleCopy} 
              className="bg-primary text-primary-foreground text-[16px] font-medium px-3 py-1 rounded-full"
              whileHover={{ 
                width: "auto",
                scale: 1.05,
                originX: 1
              }}
              whileTap={{ 
                scale: 0.9,
                originX: 1
              }}
              animate={{ 
                backgroundColor: copied ? "var(--muted-foreground)" : "var(--primary)",
                color: copied ? "var(--muted)" : "var(--primary-foreground)",
                width: "auto",
                transition: { 
                  duration: 0.15,
                  ease: "easeInOut"
                }
              }}
            >
              {copied ? "Copied" : "Copy"}
            </motion.button>
            {isMobile && (
              <motion.button 
                onClick={onShowQr} 
                className="bg-primary text-primary-foreground text-[16px] font-medium px-3 py-1 rounded-full flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <QrCode className="w-4 h-4 mr-1" />
                Show QR
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 