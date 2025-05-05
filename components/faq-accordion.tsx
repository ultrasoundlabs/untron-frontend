"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface FaqItem {
  question: string
  answer: string
  emoji?: string
}

export default function FaqAccordion() {
  const [openIndexes, setOpenIndexes] = useState<number[]>([])

  const faqItems: FaqItem[] = [
    {
      question: "What's tron?",
      answer:
        "Tron is a blockchain-based decentralized platform that aims to build a free, global digital content entertainment system with distributed storage technology.",
      emoji: "😳",
    },
    {
      question: "What's ethereum?",
      answer:
        "Ethereum is a decentralized, open-source blockchain with smart contract functionality. It enables developers to build and deploy decentralized applications.",
      emoji: "😍",
    },
    {
      question: "How to use it?",
      answer:
        "Connect your wallet, enter the amount you want to swap, select the receiving currency, and click the Swap button to complete the transaction.",
    },
    {
      question: "How to untron yourself?",
      answer:
        "To untron yourself, you need to follow our simple process of transferring your assets from Tron to another blockchain of your choice.",
      emoji: "🤔",
    },
  ]

  const toggleAccordion = (index: number) => {
    setOpenIndexes(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  return (
    <div className="space-y-4">
      {faqItems.map((item, index) => (
        <motion.div 
          key={index} 
          className="bg-white rounded-[22px] overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.1, 
            delay: index * 0.06,
            ease: "easeOut"
          }}
        >
          <div className="px-6 py-[22px]">
            <div 
              className="w-full flex items-center justify-between text-left cursor-pointer" 
              onClick={() => toggleAccordion(index)}
            >
              <span className="font-medium text-lg flex items-center">
                {item.question}
                {item.emoji && <span className="ml-1">{item.emoji}</span>}
              </span>
              <motion.div
                animate={{ rotate: openIndexes.includes(index) ? 180 : 0 }}
                transition={{ duration: 0.1, ease: "easeInOut" }}
              >
                <ChevronDown className="w-[28px] h-[28px]" />
              </motion.div>
            </div>
            
            <AnimatePresence>
              {openIndexes.includes(index) && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: "auto", 
                    opacity: 1,
                    transition: {
                      height: { duration: 0.1 },
                      opacity: { duration: 0.1, delay: 0.03 }
                    }
                  }}
                  exit={{ 
                    height: 0, 
                    opacity: 0,
                    transition: {
                      height: { duration: 0.1 },
                      opacity: { duration: 0.07 }
                    }
                  }}
                  className="mt-[4px] text-base font-normal text-[#8d8d8d] overflow-hidden"
                >
                  <motion.p
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    exit={{ y: -10 }}
                    transition={{ duration: 0.07 }}
                  >
                    {item.answer}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
