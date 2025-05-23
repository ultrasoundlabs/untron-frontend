import { OutputChain } from "@/config/chains"
import { motion, AnimatePresence } from "motion/react"
import Image from "next/image"
import { unitsToString, DEFAULT_DECIMALS } from "@/lib/units"

interface ChainSelectorProps {
  open: boolean
  chains: OutputChain[]
  selectedChainId: number
  onSelect: (chain: OutputChain) => void
  onClose: () => void
}

export default function ChainSelector({ open, chains, selectedChainId, onSelect, onClose }: ChainSelectorProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-[48px] px-[28px] pt-[28px] pb-0 w-full max-w-[400px] mx-4 h-[434px] flex flex-col overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-2xl font-normal font-geist">Select network</h3>
              <div className="relative">
                <button 
                  className="relative w-12 h-12 flex items-center justify-center focus:outline-none group" 
                  onClick={onClose}
                >
                  <div className="absolute inset-0 rounded-full bg-transparent group-hover:bg-[#F5F5F7] w-12 h-12"></div>
                  <img src="/close.svg" alt="Close" width={48} height={48} className="relative z-10" />
                </button>
              </div>
            </div>
            <div className="space-y-0 overflow-y-auto pr-2 pb-[28px] flex-1">
              {chains.map((chain) => (
                <button
                  key={chain.id}
                  className="w-full flex items-center justify-between py-2 pl-2 pr-1 rounded-[16px] hover:bg-[#F5F5F7] transition-colors"
                  onClick={() => {
                    onSelect(chain)
                    onClose()
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <img src={chain.icon} alt={chain.name} className="w-12 h-12" />
                    <div className="flex flex-col items-start">
                      <span className="text-lg font-normal text-black font-geist">{chain.name}</span>
                      {chain.fixedFeeUsd > 0n && (
                        <span className="text-[16px] text-gray-500 font-geist">
                          {unitsToString(chain.fixedFeeUsd, DEFAULT_DECIMALS)} USDT fee
                        </span>
                      )}
                    </div>
                  </div>
                  {chain.id === selectedChainId && (
                    <img src="/check.svg" alt="Selected" width={24} height={24} />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 