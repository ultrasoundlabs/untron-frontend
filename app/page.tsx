"use client"

import { useState, KeyboardEvent, ChangeEvent, useEffect } from "react"
import { ChevronDown, Loader2 } from "lucide-react"
import CurrencyInput from "@/components/currency-input"
import FaqAccordion from "@/components/faq-accordion"
import { motion, AnimatePresence } from "motion/react"
import { Geist } from "next/font/google"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useRouter } from "next/navigation"
import { useAccount, useDisconnect, useConfig } from "wagmi"
import { API_BASE_URL, ApiInfoResponse, SWAP_RATE_UNITS } from "@/config/api"
import { stringToUnits, unitsToString, DEFAULT_DECIMALS, convertSendToReceive } from "@/lib/units"
import { getEnsAddress } from '@wagmi/core'
import { normalize } from 'viem/ens'
import { OUTPUT_CHAINS, OutputChain } from "@/config/chains"
import ChainSelector from "@/components/chain-selector"
import ChainButton from "@/components/chain-button"

const isValidEVMAddress = (address: string): boolean => {
  // Ethereum address validation (0x followed by 40 hex characters)
  const ethRegex = /^0x[a-fA-F0-9]{40}$/
  
  return ethRegex.test(address)
}

const truncateAddress = (address: string) => {
  if (!address) return ""
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
})

export default function Home() {
  const [inputValue, setInputValue] = useState("")
  const [addressBadge, setAddressBadge] = useState<string | null>(null)
  const [isSwapping, setIsSwapping] = useState(false)
  const [showArrowAndFaq, setShowArrowAndFaq] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isPasteShaking, setIsPasteShaking] = useState(false)
  const [showErrorPlaceholder, setShowErrorPlaceholder] = useState(false)
  const [maxOrderOutput, setMaxOrderOutput] = useState<bigint>(0n)
  const [sendAmount, setSendAmount] = useState("")
  const [receiveAmount, setReceiveAmount] = useState("")
  const [isResolvingEns, setIsResolvingEns] = useState(false)
  const [resolvingEnsName, setResolvingEnsName] = useState("")
  const [isContentHidden, setIsContentHidden] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const { address: connectedAddress } = useAccount()
  const { disconnect } = useDisconnect()
  const config = useConfig()
  const [selectedChain, setSelectedChain] = useState<OutputChain>(OUTPUT_CHAINS[0])
  const [isChainSelectorOpen, setIsChainSelectorOpen] = useState(false)

  // Fetch API info on component mount
  useEffect(() => {
    const fetchApiInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/info`)
        const data: ApiInfoResponse = await response.json()
        setMaxOrderOutput(BigInt(data.availableLiquidity.toString()))
      } catch (error) {
        console.error('Failed to fetch API info:', error)
      }
    }
    fetchApiInfo()
  }, [])

  // Update receive amount when send amount changes (no floats)
  useEffect(() => {
    if (sendAmount) {
      try {
        const sendUnits = stringToUnits(sendAmount, DEFAULT_DECIMALS)
        let receiveUnits = convertSendToReceive(sendUnits, SWAP_RATE_UNITS)
        
        // Subtract fixed fee
        const fee = selectedChain.fixedFeeUsd
        if (receiveUnits > fee) {
          receiveUnits -= fee
        } else {
          receiveUnits = 0n
        }

        setReceiveAmount(unitsToString(receiveUnits, DEFAULT_DECIMALS))
      } catch (e) {
        setReceiveAmount("")
      }
    } else {
      setReceiveAmount("")
    }
  }, [sendAmount, selectedChain])

  // Set connected wallet address when it changes
  useEffect(() => {
    if (connectedAddress && !addressBadge && !isDisconnecting) {
      setAddressBadge(connectedAddress)
    }
  }, [connectedAddress, addressBadge, isDisconnecting])

  const resolveEnsAddress = async (ensName: string) => {
    try {
      setInputValue("")
      const normalizedName = normalize(ensName)
      const address = await getEnsAddress(config, {
        name: normalizedName,
      })
      if (address) {
        setAddressBadge(address)
        setInputValue("")
      } else {
        setIsPasteShaking(true)
        setShowErrorPlaceholder(true)
        setTimeout(() => {
          setIsPasteShaking(false)
          setShowErrorPlaceholder(false)
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to resolve ENS:', error)
      setIsPasteShaking(true)
      setShowErrorPlaceholder(true)
      setTimeout(() => {
        setIsPasteShaking(false)
        setShowErrorPlaceholder(false)
      }, 3000)
    } finally {
      setIsResolvingEns(false)
      setResolvingEnsName("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      if (isValidEVMAddress(inputValue.trim())) {
        setAddressBadge(inputValue.trim())
        setInputValue("")
      } else if (inputValue.trim().includes('.')) {
        setIsResolvingEns(true)
        setResolvingEnsName(inputValue.trim())
        resolveEnsAddress(inputValue.trim())
      } else {
        setIsPasteShaking(true)
        setShowErrorPlaceholder(true)
        setTimeout(() => {
          setIsPasteShaking(false)
          setShowErrorPlaceholder(false)
        }, 3000)
      }
    }
  }

  const handlePaste = () => {
    navigator.clipboard.readText().then((text) => {
      if (text) {
        if (isValidEVMAddress(text)) {
          setAddressBadge(text)
          setInputValue("")
        } else {
          resolveEnsAddress(text)
        }
      }
    }).catch(err => {
      console.error("Failed to read clipboard: ", err)
    })
  }

  const clearBadge = () => {
    // If we're clearing the connected wallet's address, disconnect the wallet
    if (addressBadge === connectedAddress) {
      setIsDisconnecting(true)
      disconnect()
      // Reset the disconnecting flag after a short delay to ensure the disconnection is processed
      setTimeout(() => {
        setIsDisconnecting(false)
      }, 500)
    }
    setAddressBadge(null)
  }

  const handleSwap = async () => {
    if (!addressBadge || !sendAmount || isSwapping) return

    setIsSwapping(true)
    setErrorMessage(null)

    try {
      // Convert the amount the user entered to the smallest units (6 decimals)
      const fromUnits = stringToUnits(sendAmount, DEFAULT_DECIMALS)

      const response = await fetch("https://untron.finance/api/v2-public/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toCoin: "usdt",
          toChain: selectedChain.id,
          fromAmount: Number(fromUnits.toString()),
          rate: Number(SWAP_RATE_UNITS.toString()),
          beneficiary: addressBadge,
        }),
      })

      // If the response is not OK, treat it as an error right away
      if (!response.ok) {
        throw new Error(`Unexpected status code ${response.status}`)
      }

      const data = await response.json()

      if (data?.id) {
        // Trigger exit animations
        setShowArrowAndFaq(false)
        setIsContentHidden(true)

        // Give the exit animations ~0.3s to play before navigation
        setTimeout(() => {
          router.push(`/order/${data.id}`)
        }, 300)
      } else {
        throw new Error("Missing order id in response")
      }
    } catch (error) {
      console.error("Order creation failed:", error)
      setErrorMessage("You've made too many orders. Please try again later.")
      // Re-enable UI so the user can try again
      setIsSwapping(false)
      setShowArrowAndFaq(true)
    }
  }

  return (
    <div className={`min-h-screen bg-background flex flex-col ${geist.className}`} >
      <Header />
      <main className="flex-1 w-full mx-auto px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-[560px]">
          <AnimatePresence>
            {!isContentHidden && (
              <motion.div
                className="space-y-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-medium text-[#1c1c1c]">
                    {(() => {
                      const hour = new Date().getHours();
                      if (hour < 5) return "Good late night!";
                      if (hour < 12) return "Good morning!";
                      if (hour < 18) return "Good afternoon!";
                      if (hour < 22) return "Good evening!";
                      return "Good late night!";
                    })()}
                  </h1>
                  <h1 className="text-2xl font-medium text-[#8d8d8d]">Let's transfer now.</h1>
                </div>

                <div className="space-y-4">
                  <CurrencyInput
                    label="You send"
                    value={sendAmount}
                    currency="$0"
                    currencyIcon="/USDT.svg"
                    currencyName="USDT Tron"
                    onChange={(val: string) => setSendAmount(val)}
                    maxUnits={maxOrderOutput}
                    swapRateUnits={SWAP_RATE_UNITS}
                    overlayIcon="/chains/Tron.svg"
                  />

                  <div className="bg-card rounded-[44px] pl-6 pr-[15px] w-full max-w-[560px] flex items-center h-[135px]">
                    <div className="flex-1">
                      <label className="text-[18px] font-normal text-foreground mb-0 leading-none block">
                        You receive
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={receiveAmount}
                        onChange={(e) => {
                          // Reuse existing onChange logic from CurrencyInput
                          const newValue = e.target.value.replace(/[^0-9.]/g, '')
                          if (newValue.split('.').length > 2) return;
                          setSendAmount(newValue)
                        }}
                        placeholder="0.0"
                        className="text-[36px] font-semibold outline-none w-full text-foreground p-0 leading-none placeholder:text-muted-foreground"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-normal text-muted-foreground mt-[0px] leading-none">$0</p>
                      </div>
                    </div>
                    
                    <ChainButton 
                      networkIconSrc={selectedChain.icon}
                      networkIconAlt={`${selectedChain.name} Network`}
                      onClick={() => setIsChainSelectorOpen(true)}
                    />
                  </div>

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
                                <span>{truncateAddress(addressBadge)}</span>
                                <button onClick={clearBadge} className="ml-2 text-lg leading-none">&times;</button>
                              </div>
                            </motion.div>
                          ) : (
                            <div className="relative w-full">
                              <input
                                type="text"
                                className="w-full outline-none text-black text-lg font-medium bg-transparent"
                                value={inputValue}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                // placeholder={isResolvingEns && resolvingEnsName ? `Resolving ${resolvingEnsName}...` : (showErrorPlaceholder ? "Not an Ethereum address!" : "ENS or Address")}
                                disabled={isResolvingEns}
                                autoCorrect="off"
                                spellCheck="false"
                                autoCapitalize="off"
                              />
                              <AnimatePresence>
                                {inputValue === "" && (
                                  <motion.span
                                    key={showErrorPlaceholder ? "error" : "default"}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute left-0 top-0 h-full flex items-center text-[#B5B5B5] text-lg font-medium pointer-events-none select-none"
                                  >
                                    {isResolvingEns && resolvingEnsName ? `Resolving ${resolvingEnsName}...` : (showErrorPlaceholder ? "Not an Ethereum address!" : "ENS or Address")}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
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
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            animate={isPasteShaking ? {
                              x: [0, -10, 10, -10, 10, 0],
                              transition: { duration: 0.5 }
                            } : {}}
                          >
                            Paste
                          </motion.button>
                        ) : (
                          <motion.button
                            className="bg-black text-white text-base font-medium px-4 py-1.5 rounded-full"
                            onClick={clearBadge}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Other
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <button 
                    className={`w-full py-4 rounded-[22px] text-[24px] font-medium bg-black text-white transition-colors flex justify-center items-center ${
                      (!addressBadge || !sendAmount || isSwapping) ? 'hover:bg-gray-300 hover:text-gray-500 cursor-not-allowed' : ''
                    }`}
                    onClick={handleSwap}
                    disabled={!addressBadge || !sendAmount || isSwapping}
                  >
                    {isSwapping ? (
                      <Loader2 className="animate-spin w-6 h-6" />
                    ) : (
                      "Untron!"
                    )}
                  </button>

                  {errorMessage && (
                    <p className="text-center text-red-500 mt-2 text-base">{errorMessage}</p>
                  )}

                  <p className="text-center text-regular text-[#8d8d8d] text-[18px]">I only have a Tron wallet</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showArrowAndFaq && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-center pt-[72px] pb-[104px]">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-14 h-14 text-black" />
                  </motion.div>
                </div>

                <div className="w-full max-w-[1200px] mt-8 mb-[80px]">
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-[32px] font-medium text-center mb-4"
                  >
                    FAQ
                  </motion.h2>
                  <FaqAccordion />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {!isContentHidden && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>

      <ChainSelector
        open={isChainSelectorOpen}
        chains={OUTPUT_CHAINS}
        selectedChainId={selectedChain.id}
        onSelect={(c) => setSelectedChain(c)}
        onClose={() => setIsChainSelectorOpen(false)}
      />
    </div>
  )
}
