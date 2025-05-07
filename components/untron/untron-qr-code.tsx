import { X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import SquareTimer from "@/components/square-timer"
import QRCode from "react-qr-code"

interface UntronQrCodeProps {
  isMobile: boolean
  timeLeft: number
  formatTime: () => string
  showQrOnMobile: boolean
  onCloseQr: () => void
  /** Tron USDT receiver address */
  depositAddress: string
}

export function UntronQrCode({ isMobile, timeLeft, formatTime, showQrOnMobile, onCloseQr, depositAddress }: UntronQrCodeProps) {
  const getTimeColor = () => {
    const ratio = timeLeft / 600 // 600 is the total time
    if (ratio <= 0.1) return "var(--timer-red)"
    if (ratio <= 0.4) return "var(--timer-orange)"
    return "var(--foreground)"
  }

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
                    <div className="w-[170px] h-[170px] flex items-center justify-center">
                      <QRCode
                        value={depositAddress}
                        size={170}
                        fgColor="#000000"
                        bgColor="transparent"
                      />
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
    <div className="w-full flex flex-col lg:items-end lg:pt-1 lg:pr-16">
      <SquareTimer 
        total={600} 
        currentTime={timeLeft} 
        onTimeChange={() => {}}
        size={294}
        stroke={8}
      >
        <div className="w-[202px] h-[202px] flex items-center justify-center">
          <QRCode
            value={depositAddress}
            size={202}
            fgColor="#000000"
            bgColor="transparent"
          />
        </div>
      </SquareTimer>

      <div className="mt-[18px] text-center w-[302px] ml-[4px]">
        <div className="text-[30px] font-medium" style={{ color: getTimeColor() }}>{formatTime()}</div>
        <div className="mt-[2px] text-[16px] font-regular text-muted-foreground">Waiting for transfer...</div>
      </div>
    </div>
  )
} 