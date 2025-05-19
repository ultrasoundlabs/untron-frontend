import { OutputChain } from "@/config/chains"
import { motion, AnimatePresence } from "motion/react"

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
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-[22px] p-6 w-full max-w-[400px] mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4 text-center">Select output chain</h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              {chains.map((chain) => (
                <button
                  key={chain.id}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-[18px] border ${
                    chain.id === selectedChainId ? 'bg-gray-100' : 'bg-white'
                  } hover:bg-gray-50 transition-colors`}
                  onClick={() => {
                    onSelect(chain)
                    onClose()
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <img src={chain.icon} alt={chain.name} className="w-6 h-6" />
                    <span className="text-base font-medium text-black">{chain.name}</span>
                  </div>
                  {chain.id === selectedChainId && (
                    <span className="text-sm text-green-600 font-medium">Selected</span>
                  )}
                </button>
              ))}
            </div>
            <button
              className="mt-4 w-full bg-black text-white py-2 rounded-[18px] font-medium hover:bg-gray-800 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 