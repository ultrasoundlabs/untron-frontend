"use client"

import { useState, KeyboardEvent, ChangeEvent } from "react"
import { ChevronDown } from "lucide-react"
import CurrencyInput from "@/components/currency-input"
import FaqAccordion from "@/components/faq-accordion"
import { motion, AnimatePresence } from "motion/react"
import { Geist } from "next/font/google"
import Header from "@/components/header"
import Footer from "@/components/footer"

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
})

export default function Home() {
  const [inputValue, setInputValue] = useState("")
  const [addressBadge, setAddressBadge] = useState<string | null>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      setAddressBadge(inputValue.trim())
      setInputValue("")
    }
  }

  const handlePaste = () => {
    navigator.clipboard.readText().then((text) => {
      if (text) {
        setAddressBadge(text)
        setInputValue("")
      }
    }).catch(err => {
      console.error("Failed to read clipboard: ", err)
    })
  }

  const clearBadge = () => {
    setAddressBadge(null)
  }

  return (
    <div className={`min-h-screen bg-background flex flex-col ${geist.className}`} >
      <Header />

      <main className="flex-1 w-full mx-auto px-4 py-8 flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-[#1c1c1c]">Good evening</h1>
          <h1 className="text-2xl font-medium text-[#8d8d8d]">Let's transfer now!</h1>
        </div>

        <div className="w-full max-w-[560px] space-y-4">
          <CurrencyInput
            label="You send"
            value=""
            currency="$0"
            currencyIcon="/USDTtron.svg"
            currencyName="USDT Tron"
          />

          <CurrencyInput
            label="You receive"
            value=""
            currency="$0"
            currencyIcon="/USDTarb.svg"
            currencyName="USDT ARB"
          />

          <div className="bg-white rounded-[22px] py-[14px] flex items-center">
            <div className="flex-1 flex items-center pl-[16px]">
              <div className="flex items-center w-full">
                <span className="text-lg font-regular text-[#000000] mr-2">To</span>
                <AnimatePresence>
                  {addressBadge ? (
                    <motion.div
                      className="flex items-center"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="bg-black text-white text-base font-medium px-4 py-1.5 rounded-full flex items-center">
                        <span>{addressBadge}</span>
                        <button onClick={clearBadge} className="ml-2 text-lg leading-none">&times;</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.input
                      type="text"
                      placeholder="ENS or Address"
                      className="w-full outline-none text-black text-lg font-medium placeholder:text-lg placeholder:font-medium placeholder:text-[#B5B5B5]"
                      value={inputValue}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="pr-[10px]">
              <AnimatePresence>
                {!addressBadge ? (
                  <motion.button
                    className="bg-black text-white text-base font-medium px-4 py-1.5 rounded-full"
                    onClick={handlePaste}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Paste
                  </motion.button>
                ) : (
                  <motion.button
                    className="bg-black text-white text-base font-medium px-4 py-1.5 rounded-full"
                    onClick={clearBadge}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Other
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button className="w-full bg-black text-white py-4 rounded-[22px] text-[24px] font-medium">Swap</button>

          <p className="text-center text-regular text-[#8d8d8d] text-[18px]">I only have a Tron wallet</p>

          <div className="flex justify-center pt-[72px] pb-[104px]">
            <ChevronDown className="w-14 h-14 text-black" />
          </div>
        </div>

        <div className="w-full max-w-[1200px] mt-8 mb-[80px]">
          <h2 className="text-[32px] font-medium text-center mb-4">FAQ</h2>
          <FaqAccordion />
        </div>
      </main>

      <Footer />
    </div>
  )
}
