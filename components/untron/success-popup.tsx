"use client"

import React, { useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, ExternalLink, CheckCircle } from "lucide-react"
import Image from "next/image"

interface SuccessPopupProps {
  isOpen: boolean
  onClose: () => void
  address: string
  txHash?: string
}

export function SuccessPopup({ isOpen, onClose, address, txHash }: SuccessPopupProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  const tronscanUrl = txHash 
    ? `https://tronscan.org/#/transaction/${txHash}`
    : `https://tronscan.org/#/address/${address}/transfers`

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-white rounded-[48px] p-[28px] max-w-[400px] w-full mx-4 pointer-events-auto relative">
              <button
                onClick={onClose}
                className="absolute top-[28px] right-[28px] p-2 rounded-full hover:bg-[#F5F5F7] transition-colors"
              >
                <X size={20} className="text-black" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-[80px] h-[80px] bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={48} className="text-green-500" />
                </div>

                <h2 className="text-xl font-medium font-geist text-black mb-2">
                  Transfer Submitted!
                </h2>
                
                <p className="text-base font-normal text-[#8d8d8d] font-geist mb-8">
                  Your transfer has been successfully submitted to the Tron network.
                </p>

                <a
                  href={tronscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-black text-white rounded-[16px] px-6 py-4 font-medium font-geist flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                >
                  View on Tronscan
                  <ExternalLink size={18} />
                </a>

                <div className="mt-6 flex items-center gap-2">
                  <Image 
                    src="/tokens/tron.svg" 
                    alt="Tron" 
                    width={24} 
                    height={24} 
                  />
                  <span className="text-sm text-[#8d8d8d] font-geist">
                    Tron Network
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}