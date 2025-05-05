import { X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import SquareTimer from "@/components/square-timer"

interface UntronQrCodeProps {
  isMobile: boolean
  timeLeft: number
  formatTime: () => string
  showQrOnMobile: boolean
  onCloseQr: () => void
}

export function UntronQrCode({ isMobile, timeLeft, formatTime, showQrOnMobile, onCloseQr }: UntronQrCodeProps) {
  if (isMobile) {
    return (
      <AnimatePresence>
        {showQrOnMobile && (
          <motion.div 
            className="fixed inset-0 bg-primary/70 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div 
              className="bg-card rounded-[48px] w-[320px]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex flex-col items-start w-full px-[32px]">
                <div className="w-full py-[14px] pt-[20px] flex justify-between items-center">
                  <h3 className="text-[24px] font-medium text-foreground font-geist">QR Code</h3>
                  <motion.button 
                    onClick={onCloseQr}
                    className="w-[32px] h-[32px] flex items-center justify-center rounded-full bg-muted"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-6 h-6" strokeWidth={2.5} />
                  </motion.button>
                </div>
                <div className="pb-[32px] flex flex-col items-center w-full">
                  <SquareTimer 
                    total={600} 
                    currentTime={timeLeft} 
                    onTimeChange={() => {}}
                    size={250}
                    stroke={8}
                  >
                    <div className="w-[170px] h-[170px]">
                      <img src="/qr-code.svg" alt="QR Code" className="w-full h-full" />
                    </div>
                  </SquareTimer>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <div className="w-full lg:w-2/5 flex flex-col lg:items-end lg:pt-1">
      <SquareTimer 
        total={600} 
        currentTime={timeLeft} 
        onTimeChange={() => {}}
        size={294}
        stroke={8}
      >
        <div className="w-[202px] h-[202px]">
          <img src="/qr-code.svg" alt="QR Code" className="w-full h-full" />
        </div>
      </SquareTimer>

      <div className="mt-[18px] text-center w-[302px] ml-[4px]">
        <div className="text-[30px] font-medium">{formatTime()}</div>
        <div className="mt-[2px] text-[16px] font-regular text-muted-foreground">Waiting for transfer...</div>
      </div>
    </div>
  )
} 