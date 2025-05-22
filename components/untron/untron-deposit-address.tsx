import { QrCode } from "lucide-react"
import { motion } from "motion/react"

// Helper function to format address display
const formatAddress = (address: string, truncate = false): string => {
  if (!address) return "";
  if (!truncate) return address;
  
  // For mobile, replace characters 15-20 with "..."
  if (address.length > 20) {
    return `${address.slice(0, 14)}...${address.slice(20)}`;
  }
  
  // Fallback for shorter addresses
  return address;
}

interface UntronDepositAddressProps {
  copied: boolean
  handleCopy: () => void
  isMobile: boolean
  onShowQr: () => void
  depositAddress: string
}

export function UntronDepositAddress({ copied, handleCopy, isMobile, onShowQr, depositAddress }: UntronDepositAddressProps) {
  return (
    <div className="mb-4 w-full">
      <div className="bg-card rounded-[22px] py-3 px-4 w-full">
        <div className="text-[18px] text-muted-foreground font-regular mb-[0px]">Deposit address</div>
        <div className="flex items-center justify-between w-full flex-wrap sm:flex-nowrap gap-2 sm:gap-0">
          <div className="text-[18px] font-medium text-foreground truncate pr-2 w-full sm:w-auto">
            {formatAddress(depositAddress, isMobile)}
          </div>
          <div className="flex-shrink-0 ml-auto sm:ml-0 flex gap-2">
            <motion.button 
              onClick={handleCopy} 
              className="bg-black text-white text-[16px] font-medium px-3 py-1 rounded-full"
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
                backgroundColor: "black",
                color: "white",
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