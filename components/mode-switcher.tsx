"use client"

import { motion } from "motion/react"

export type TransferMode = "send" | "receive"

interface ModeSwitcherProps {
  mode: TransferMode
  onModeChange: (mode: TransferMode) => void
}

export default function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="bg-white rounded-[22px] py-1 px-1 flex items-center gap-2 mb-1 w-fit mx-left relative">
      {/* Send Tron Button */}
      <motion.button
        onClick={() => onModeChange("send")}
        className="relative text-base font-regular px-4 py-1.5 rounded-full"
        animate={{
          color: mode === "send" ? "#000000" : "#8d8d8d"
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
        whileTap={{ scale: 0.95 }}
      >
        {mode === "send" && (
          <motion.span
            layoutId="mode-switcher-indicator"
            className="absolute inset-0 bg-[#F3F2F2] rounded-full z-0"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10">Send Tron</span>
      </motion.button>
      
      {/* Receive Tron Button */}
      <motion.button
        onClick={() => onModeChange("receive")}
        className="relative text-base font-regular px-4 py-1.5 rounded-full"
        animate={{
          color: mode === "receive" ? "#000000" : "#8d8d8d"
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
        whileTap={{ scale: 0.95 }}
      >
        {mode === "receive" && (
          <motion.span
            layoutId="mode-switcher-indicator"
            className="absolute inset-0 bg-[#F3F2F2] rounded-full z-0"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10">Receive Tron</span>
      </motion.button>
    </div>
  )
} 