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
import { stringToUnits, unitsToString, DEFAULT_DECIMALS, convertSendToReceive, convertReceiveToSend } from "@/lib/units"
import { getEnsAddress } from '@wagmi/core'
import { normalize } from 'viem/ens'
import { getAddress } from 'viem'
import { OUTPUT_CHAINS, OutputChain } from "@/config/chains"
import ChainSelector from "@/components/chain-selector"
import ChainButton from "@/components/chain-button"

const isValidEVMAddress = (address: string): boolean => {
  // Ethereum address validation (0x followed by 40 hex characters)
  const ethRegex = /^0x[a-fA-F0-9]{40}$/
  
  return ethRegex.test(address)
}

const isValidDomainName = (name: string): boolean => {
  // General domain name validation (e.g., name.eth, sub.name.com)
  // Allows for subdomains and various TLDs (at least 2 chars)
  const domainRegex = /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
  return domainRegex.test(name)
}

const isPotentialEnsName = (name: string): boolean => {
  if (!isValidDomainName(name)) {
    return false
  }
  return name.toLowerCase().endsWith('.eth') || name.toLowerCase().endsWith('.cb.id')
}

const truncateAddress = (address: string) => {
  if (!address) return ""
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatCurrency = (value: string) => {
  if (!value) return "$0"
  const num = parseFloat(value)
  if (isNaN(num)) return "$0"
  const formatted = num.toFixed(2)
  if (formatted.endsWith(".00")) {
    return `$${num.toFixed(0)}`
  }
  return `$${formatted}`
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
  const [showWalletLink, setShowWalletLink] = useState(true)
  const [userClearedAddress, setUserClearedAddress] = useState(false)
  const router = useRouter()
  const { address: connectedAddress } = useAccount()
  const { disconnect } = useDisconnect()
  const config = useConfig()
  const [selectedChain, setSelectedChain] = useState<OutputChain>(OUTPUT_CHAINS[0])
  const [isChainSelectorOpen, setIsChainSelectorOpen] = useState(false)
  const [isReceiveUpdating, setIsReceiveUpdating] = useState(false)

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
    if (isReceiveUpdating) {
      setIsReceiveUpdating(false)
      return
    }

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
    if (connectedAddress && !addressBadge && !isDisconnecting && !userClearedAddress) {
      try {
        const checksummedAddress = getAddress(connectedAddress);
        setAddressBadge(checksummedAddress);
      } catch (error) {
        console.error("Failed to checksum connected address:", error);
        // Optionally handle the error, e.g., by setting the non-checksummed address
        // or displaying an error message. For now, we'll let it be.
        setAddressBadge(connectedAddress);
      }
    }
  }, [connectedAddress, addressBadge, isDisconnecting, userClearedAddress])

  // Reset userClearedAddress when wallet is disconnected
  useEffect(() => {
    if (!connectedAddress) {
      setUserClearedAddress(false)
    }
  }, [connectedAddress])

  // Automatically set address or resolve ENS from input
  useEffect(() => {
    const trimmedValue = inputValue.trim();

    // If input is empty after trimming, or if ENS resolution is already in progress, do nothing.
    if (!trimmedValue || isResolvingEns) {
      return;
    }

    if (isValidEVMAddress(trimmedValue)) {
      try {
        const checksummedAddress = getAddress(trimmedValue);
        setAddressBadge(checksummedAddress);
        setUserClearedAddress(false);
        setInputValue(""); // Clear input, leading to badge display
      } catch (error) {
        console.error("Failed to checksum address:", error);
        // Fallback or error display if needed
        setAddressBadge(trimmedValue); // Or handle error appropriately
        setUserClearedAddress(false);
        setInputValue("");
      }
    } else if (isPotentialEnsName(trimmedValue)) {
      // Not an EVM address, but could be an ENS name.
      // isResolvingEns is already false due to the check at the effect's start.
      setIsResolvingEns(true);
      setResolvingEnsName(trimmedValue);
      resolveEnsAddress(trimmedValue); // This will also clear inputValue
    }
  }, [inputValue, isResolvingEns]); // Dependencies updated

  // Hide Tron wallet link if input has value or badge is set
  useEffect(() => {
    if (inputValue.trim() !== "" || addressBadge || isResolvingEns) {
      setShowWalletLink(false)
    } else {
      setShowWalletLink(true)
    }
  }, [inputValue, addressBadge, isResolvingEns])

  const resolveEnsAddress = async (ensName: string) => {
    try {
      setInputValue("")
      const normalizedName = normalize(ensName)
      const address = await getEnsAddress(config, {
        name: normalizedName,
      })
      if (address) {
        try {
          const checksummedAddress = getAddress(address);
          setAddressBadge(checksummedAddress);
          setUserClearedAddress(false);
          setInputValue("")
        } catch (checksumError) {
          console.error('Failed to checksum resolved ENS address:', checksumError);
          setAddressBadge(address); // Fallback to non-checksummed
          setUserClearedAddress(false);
          setInputValue("");
        }
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
      const trimmedValue = inputValue.trim()
      if (isValidEVMAddress(trimmedValue)) {
        try {
          const checksummedAddress = getAddress(trimmedValue);
          setAddressBadge(checksummedAddress);
          setUserClearedAddress(false);
          setInputValue("");
        } catch (error) {
          console.error("Failed to checksum address on Enter:", error);
          setAddressBadge(trimmedValue); // Fallback
          setUserClearedAddress(false);
          setInputValue("");
        }
      } else if (isValidDomainName(trimmedValue)) {
        // ENS resolution is now handled by useEffect, but we can still trigger it on Enter if needed
        // or if the user confirms an ENS name they typed.
        // For now, we'll let the useEffect handle it. If the user presses Enter
        // on an ENS-like name and it hasn't resolved yet, it will be picked up by the useEffect.
        // If it's already resolving, this Enter press won't do much harm.
        // Alternatively, if we want Enter to specifically *confirm* an ENS name even if it's auto-resolving:
        if (!isResolvingEns) { // Only trigger if not already resolving
            setIsResolvingEns(true)
            setResolvingEnsName(trimmedValue)
            resolveEnsAddress(trimmedValue)
        }
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
          try {
            const checksummedAddress = getAddress(text);
            setAddressBadge(checksummedAddress);
            setUserClearedAddress(false);
            setInputValue("");
          } catch (error) {
            console.error("Failed to checksum pasted address:", error);
            setAddressBadge(text); // Fallback
            setUserClearedAddress(false);
            setInputValue("");
          }
        } else {
          // Trigger ENS resolution on paste if it looks like an ENS name
          if (isValidDomainName(text) && !isResolvingEns) {
            setIsResolvingEns(true)
            setResolvingEnsName(text)
            resolveEnsAddress(text)
          } else if (!isValidDomainName(text)) { // If it's not an ENS and not a valid address
            setIsPasteShaking(true)
            setShowErrorPlaceholder(true)
            setTimeout(() => {
              setIsPasteShaking(false)
              setShowErrorPlaceholder(false)
            }, 3000)
          }
        }
      }
    }).catch(err => {
      console.error("Failed to read clipboard: ", err)
    })
  }

  const clearBadge = () => {
    // Clear the address badge and disconnect the wallet
    setAddressBadge(null)
    setUserClearedAddress(true)
    setIsDisconnecting(true)
    disconnect() // Disconnect the wallet
    
    // Reset the disconnecting flag after a short delay
    setTimeout(() => {
      setIsDisconnecting(false)
    }, 500)
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
                    currency={formatCurrency(sendAmount)}
                    currencyIcon="/USDT.svg"
                    currencyName="USDT Tron"
                    onChange={(val: string) => setSendAmount(val)}
                    maxUnits={maxOrderOutput}
                    swapRateUnits={SWAP_RATE_UNITS}
                    overlayIcon="/chains/Tron.svg"
                  />

                  <CurrencyInput
                    label="You receive"
                    value={receiveAmount}
                    currency={formatCurrency(receiveAmount)}
                    currencyIcon="/USDT.svg"
                    currencyName="USDT"
                    onChange={(val: string) => {
                      // When receive value changes, we need to calculate and update send amount
                      try {
                        setReceiveAmount(val);
                        
                        if (val) {
                          setIsReceiveUpdating(true);
                          
                          const receiveUnits = stringToUnits(val, DEFAULT_DECIMALS);
                          // Add back the fee for accurate calculation
                          const receiveWithFee = receiveUnits + selectedChain.fixedFeeUsd;
                          // Convert to send amount
                          const sendUnits = convertReceiveToSend(receiveWithFee, SWAP_RATE_UNITS);

                          const newSendAmount = unitsToString(sendUnits, DEFAULT_DECIMALS);
                          setSendAmount(newSendAmount);
                        } else {
                          setSendAmount("");
                        }
                      } catch (e) {
                        setSendAmount("");
                      }
                    }}
                    isReceive={false}
                    maxUnits={maxOrderOutput}
                    swapRateUnits={SWAP_RATE_UNITS}
                    onIconClick={() => setIsChainSelectorOpen(true)}
                    overlayIcon={selectedChain.icon}
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

                  <AnimatePresence>
                    {showWalletLink && (
                      <motion.a
                        href="https://keys.coinbase.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="text-center text-regular text-[#8d8d8d] text-[18px]">Only got a Tron wallet? 👈</p>
                      </motion.a>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showArrowAndFaq && (
              <motion.div
                layout
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
