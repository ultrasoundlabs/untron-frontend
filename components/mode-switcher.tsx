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
      {/* Untron Button */}
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
        <span className="relative z-10">Untron</span>
      </motion.button>
      
      {/* Into Tron Button (disabled) */}
      <motion.button
        disabled
        className="relative text-base font-regular px-4 py-1.5 rounded-full cursor-not-allowed"
        animate={{
          color: "#8d8d8d"
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
      >
        <span className="relative z-10">Into Tron</span>
      </motion.button>
    </div>
  )
} 