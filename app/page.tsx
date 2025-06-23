"use client"

import { useState, KeyboardEvent, ChangeEvent, useEffect, useMemo } from "react"
import { ChevronDown, Loader2 } from "lucide-react"
import CurrencyInput from "@/components/currency-input"
import FaqAccordion from "@/components/faq-accordion"
import { motion, AnimatePresence } from "motion/react"
import { Geist } from "next/font/google"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useRouter } from "next/navigation"
import { useAccount, useDisconnect, useConfig } from "wagmi"
import { API_BASE_URL, ApiInfoResponse } from "@/config/api"
import { stringToUnits, unitsToString, DEFAULT_DECIMALS, convertSendToReceive, RATE_SCALE } from "@/lib/units"
import { getEnsAddress } from '@wagmi/core'
import { normalize } from 'viem/ens'
import { getAddress } from 'viem'
import { OUTPUT_CHAINS, OutputChain } from "@/config/chains"
import ChainSelector from "@/components/chain-selector"
import ChainButton from "@/components/chain-button"
import ModeSwitcher, { TransferMode } from "@/components/mode-switcher"
import { fetchUserTokens, UserToken } from "@/lib/fetchUserTokens"
import { useConnectModal } from "@rainbow-me/rainbowkit"

const isValidEVMAddress = (address: string): boolean => {
  // Ethereum address validation (0x followed by 40 hex characters)
  const ethRegex = /^0x[a-fA-F0-9]{40}$/
  
  return ethRegex.test(address)
}

const isValidTronAddress = (address: string): boolean => {
  // Tron base58 address validation – starts with "T" and is 34 chars in total
  // This is a simplified check that covers the vast majority of main-net & test-net addresses.
  const tronRegex = /^T[a-zA-Z0-9]{33}$/
  return tronRegex.test(address)
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

// Fee configuration
const FROM_TRON_FEE_BPS = 3n; // 3 basis points (0.03%)
const INTO_TRON_STATIC_FEE: bigint = 2_000_000n; // 2 USDT/USDC (6-decimals)
const INTO_TRON_MAX_AMOUNT: bigint = 1_000_000_000n; // 1,000 USDT/USDC (6-decimals)

// Rate units after 3 bps fee: 1e6 * (1 - feeBps/10000)
const FROM_TRON_RATE_UNITS: bigint = RATE_SCALE - (RATE_SCALE * FROM_TRON_FEE_BPS) / 10000n;

// Helper: convert desired receiveUnits back to required sendUnits using swap rate
const computeSendUnitsFromReceiveFromTron = (receiveUnits: bigint): bigint => {
  // send = ceil(receive * 10000 / (10000 - feeBps))
  const numerator = receiveUnits * 10000n;
  const denominator = 10000n - FROM_TRON_FEE_BPS;
  return (numerator + denominator - 1n) / denominator;
};

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
  const [transferMode, setTransferMode] = useState<TransferMode>("send")
  const [selectedToken, setSelectedToken] = useState<string>("USD₮0")
  const [userTokens, setUserTokens] = useState<UserToken[]>([])
  const { openConnectModal } = useConnectModal();

  // Allowed chains in RECEIVE mode (ordered)
  const RECEIVE_CHAIN_IDS: number[] = [8453, 10, 130, 480, 42161]
  const receiveChains = OUTPUT_CHAINS.filter((c) => RECEIVE_CHAIN_IDS.includes(c.id)).sort(
    (a, b) => RECEIVE_CHAIN_IDS.indexOf(a.id) - RECEIVE_CHAIN_IDS.indexOf(b.id)
  )

  // Keep selectedChain valid when switching to receive mode
  useEffect(() => {
    if (transferMode === "receive" && !RECEIVE_CHAIN_IDS.includes(selectedChain.id)) {
      setSelectedChain(receiveChains[0])
    }
  }, [transferMode])

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

  // Update receive amount whenever sendAmount changes
  useEffect(() => {
    if (isReceiveUpdating) {
      setIsReceiveUpdating(false);
      return;
    }

    if (!sendAmount) {
      setReceiveAmount("");
      return;
    }

    try {
      const sendUnits = stringToUnits(sendAmount, DEFAULT_DECIMALS);
      let receiveUnits: bigint;
      if (transferMode === "send") {
        // From Tron – apply rate (0.9997)
        receiveUnits = convertSendToReceive(sendUnits, FROM_TRON_RATE_UNITS);
      } else {
        // Into Tron – start with 1:1 rate
        receiveUnits = sendUnits;
        // Apply flat 2-token fee
        receiveUnits = receiveUnits > INTO_TRON_STATIC_FEE ? receiveUnits - INTO_TRON_STATIC_FEE : 0n;
      }

      setReceiveAmount(unitsToString(receiveUnits, DEFAULT_DECIMALS));
    } catch {
      setReceiveAmount("");
    }
  }, [sendAmount, selectedChain, transferMode]);

  // Set connected wallet address when it changes (only in send mode)
  useEffect(() => {
    if (connectedAddress && !addressBadge && !isDisconnecting && !userClearedAddress && transferMode === "send") {
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
  }, [connectedAddress, addressBadge, isDisconnecting, userClearedAddress, transferMode])

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

    if (transferMode === "send") {
      // SEND ➜ requires an EVM address or ENS
      if (isValidEVMAddress(trimmedValue)) {
        try {
          const checksummedAddress = getAddress(trimmedValue);
          setAddressBadge(checksummedAddress);
          setUserClearedAddress(false);
          setInputValue("");
        } catch (error) {
          console.error("Failed to checksum address:", error);
          setAddressBadge(trimmedValue);
          setUserClearedAddress(false);
          setInputValue("");
        }
      } else if (isPotentialEnsName(trimmedValue)) {
        setIsResolvingEns(true);
        setResolvingEnsName(trimmedValue);
        resolveEnsAddress(trimmedValue);
      }
    } else {
      // RECEIVE ➜ expects a Tron address
      if (isValidTronAddress(trimmedValue)) {
        setAddressBadge(trimmedValue);
        setUserClearedAddress(false);
        setInputValue("");
      }
    }
  }, [inputValue, isResolvingEns, transferMode]);

  // Hide Tron wallet link if input has value or badge is set
  useEffect(() => {
    if (inputValue.trim() !== "" || addressBadge || isResolvingEns || connectedAddress) {
      setShowWalletLink(false)
    } else {
      setShowWalletLink(true)
    }
  }, [inputValue, addressBadge, isResolvingEns, connectedAddress])

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

      if (transferMode === "send") {
        if (isValidEVMAddress(trimmedValue)) {
          try {
            const checksummedAddress = getAddress(trimmedValue)
            setAddressBadge(checksummedAddress)
            setUserClearedAddress(false)
            setInputValue("")
          } catch (error) {
            console.error("Failed to checksum address on Enter:", error)
            setAddressBadge(trimmedValue)
            setUserClearedAddress(false)
            setInputValue("")
          }
        } else if (isValidDomainName(trimmedValue)) {
          if (!isResolvingEns) {
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
      } else {
        // RECEIVE mode
        if (isValidTronAddress(trimmedValue)) {
          setAddressBadge(trimmedValue)
          setUserClearedAddress(false)
          setInputValue("")
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
  }

  const handlePaste = () => {
    navigator.clipboard.readText()
      .then((text) => {
        if (!text) return

        if (transferMode === "send") {
          if (isValidEVMAddress(text)) {
            try {
              const checksummedAddress = getAddress(text)
              setAddressBadge(checksummedAddress)
              setUserClearedAddress(false)
              setInputValue("")
            } catch (error) {
              console.error("Failed to checksum pasted address:", error)
              setAddressBadge(text)
              setUserClearedAddress(false)
              setInputValue("")
            }
          } else if (isValidDomainName(text) && !isResolvingEns) {
            setIsResolvingEns(true)
            setResolvingEnsName(text)
            resolveEnsAddress(text)
          } else if (!isValidDomainName(text)) {
            setIsPasteShaking(true)
            setShowErrorPlaceholder(true)
            setTimeout(() => {
              setIsPasteShaking(false)
              setShowErrorPlaceholder(false)
            }, 3000)
          }
        } else {
          // RECEIVE mode (Tron)
          if (isValidTronAddress(text)) {
            setAddressBadge(text)
            setUserClearedAddress(false)
            setInputValue("")
          } else {
            setIsPasteShaking(true)
            setShowErrorPlaceholder(true)
            setTimeout(() => {
              setIsPasteShaking(false)
              setShowErrorPlaceholder(false)
            }, 3000)
          }
        }
      })
      .catch((err) => {
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

  // Business logic – FROM Tron to another chain ("Untron" flow)
  const handleSwapFromTron = async () => {
    if (!addressBadge || !sendAmount || isSwapping) return

    setIsSwapping(true)
    setErrorMessage(null)

    try {
      // Convert the amount the user entered to the smallest units (6 decimals)
      const fromUnits = stringToUnits(sendAmount, DEFAULT_DECIMALS)

      const orderPayload = {
        // From Tron to selected L2 chain
        toCoin: "usdt",
        toChain: selectedChain.id,
        fromAmount: Number(fromUnits.toString()),
        rate: Number(FROM_TRON_RATE_UNITS.toString()),
        beneficiary: addressBadge,
      }

      const response = await fetch("https://untron.finance/api/v2-public/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      })

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
      setIsSwapping(false)
      setShowArrowAndFaq(true)
    }
  }

  // Business logic – INTO Tron (L2 ➜ Tron). Will require signature and a different API.
  // Placeholder for future implementation so that the code paths stay clearly separated.
  const handleSwapIntoTron = async () => {
    if (!addressBadge || !sendAmount || isSwapping) return

    // TODO: Implement L2 ➜ Tron flow – will require signature collection
    // For now we simply notify the user that the feature is not yet available.
    console.warn("L2 ➜ Tron flow is not implemented yet. Coming soon!")
    setErrorMessage("L2 ➜ Tron flow is not implemented yet. Coming soon!")
  }

  // Fetch the user's tokens whenever they switch into receive mode & have an address connected
  useEffect(() => {
    if (transferMode === "receive" && connectedAddress) {
      // @ts-ignore – wagmi provides address as `0x...` string which satisfies viem's Address
      fetchUserTokens(connectedAddress as any).then(setUserTokens).catch(console.error)
    }
  }, [transferMode, connectedAddress])

  // Convenience: resolve the icon for the currently selected token (fallback to USD₮0/USDC svg assets)
  const selectedTokenIcon = useMemo(() => {
    const match = userTokens.find((t) => t.symbol === selectedToken)
    if (match) return match.icon
    if (selectedToken === "USD₮0") return "/USDT.svg"
    if (selectedToken === "USDC") return "/usdc.svg"
    // Generic placeholder
    return "/token-placeholder.svg"
  }, [selectedToken, userTokens])

  const buttonDisabled = useMemo(() => {
    if (transferMode === "receive" && !connectedAddress) {
      return false; // Connect Wallet button should always be clickable
    }
    return !addressBadge || !sendAmount || isSwapping;
  }, [transferMode, connectedAddress, addressBadge, sendAmount, isSwapping]);

  const handleButtonClick = () => {
    if (transferMode === "receive" && !connectedAddress) {
      if (openConnectModal) {
        openConnectModal();
      }
      return;
    }
    if (transferMode === "send") {
      handleSwapFromTron();
    } else {
      handleSwapIntoTron();
    }
  };

  // Determine mode-specific max liquidity cap
  const effectiveMaxUnits = useMemo(() => {
    if (transferMode === "receive") {
      return maxOrderOutput > INTO_TRON_MAX_AMOUNT ? INTO_TRON_MAX_AMOUNT : maxOrderOutput;
    }
    return maxOrderOutput;
  }, [transferMode, maxOrderOutput]);

  return (
    <div className={`min-h-screen bg-background flex flex-col ${geist.className}`} >
      <Header />
      <main className="flex-1 w-full mx-auto px-4 py-2 flex flex-col items-center">
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

                <ModeSwitcher 
                  mode={transferMode} 
                  onModeChange={(mode) => {
                    setTransferMode(mode)
                    // Clear amounts when switching modes
                    setSendAmount("")
                    setReceiveAmount("")
                    // Clear address field as different modes require different address types
                    setAddressBadge(null)
                    setInputValue("")
                    setUserClearedAddress(false)
                    // Reset token to USDT when switching to send mode
                    if (mode === "send") {
                      setSelectedToken("USD₮0")
                    }
                  }}
                />

                <div className="space-y-4">
                  {transferMode === "send" ? (
                    <>
                      <CurrencyInput
                        label="You send"
                        value={sendAmount}
                        currency={formatCurrency(sendAmount)}
                        currencyIcon="/USDT.svg"
                        currencyName="USDT Tron"
                        onChange={(val: string) => setSendAmount(val)}
                        maxUnits={effectiveMaxUnits}
                        swapRateUnits={FROM_TRON_RATE_UNITS}
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
                              // Calculate required send amount considering 3 bps fee
                              const sendUnits = computeSendUnitsFromReceiveFromTron(receiveUnits);

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
                        maxUnits={effectiveMaxUnits}
                        swapRateUnits={FROM_TRON_RATE_UNITS}
                        onIconClick={() => setIsChainSelectorOpen(true)}
                        overlayIcon={selectedChain.icon}
                      />
                    </>
                  ) : (
                    <>
                      <CurrencyInput
                        label="You send"
                        value={sendAmount}
                        currency={formatCurrency(sendAmount)}
                        currencyIcon={selectedTokenIcon}
                        currencyName={selectedToken}
                        onChange={(val: string) => {
                          // When the amount the user WILL SEND (non-Tron) changes, calculate how much they will receive on Tron
                          try {
                            setSendAmount(val)

                            if (val) {
                              setIsReceiveUpdating(true)

                              const sendUnits = stringToUnits(val, DEFAULT_DECIMALS)
                              // Convert to Tron side and subtract static 2 USDT fee
                              const receiveUnits = sendUnits;
                              const receiveAfterFee =
                                receiveUnits > INTO_TRON_STATIC_FEE
                                  ? receiveUnits - INTO_TRON_STATIC_FEE
                                  : 0n;

                              const newReceiveAmount = unitsToString(receiveAfterFee, DEFAULT_DECIMALS)
                              setReceiveAmount(newReceiveAmount)
                            } else {
                              setReceiveAmount("")
                            }
                          } catch (e) {
                            setReceiveAmount("")
                          }
                        }}
                        maxUnits={effectiveMaxUnits}
                        swapRateUnits={RATE_SCALE}
                        onIconClick={() => setIsChainSelectorOpen(true)}
                        overlayIcon={selectedChain.icon}
                      />

                      <CurrencyInput
                        label="You receive"
                        value={receiveAmount}
                        currency={formatCurrency(receiveAmount)}
                        currencyIcon="/USDT.svg"
                        currencyName="USDT Tron"
                        onChange={(val: string) => {
                          // When the DESIRED Tron receive amount changes, calculate how much the user needs to send
                          try {
                            setReceiveAmount(val)

                            if (val) {
                              setIsReceiveUpdating(true)

                              const receiveUnits = stringToUnits(val, DEFAULT_DECIMALS)
                              // Add fee first, then convert back to the amount to send
                              const receiveWithFee = receiveUnits + INTO_TRON_STATIC_FEE
                              const sendUnits = receiveWithFee; // identity

                              const newSendAmount = unitsToString(sendUnits, DEFAULT_DECIMALS)
                              setSendAmount(newSendAmount)
                            } else {
                              setSendAmount("")
                            }
                          } catch (e) {
                            setSendAmount("")
                          }
                        }}
                        maxUnits={effectiveMaxUnits}
                        swapRateUnits={RATE_SCALE}
                        overlayIcon="/chains/Tron.svg"
                        isReceive={false}
                      />
                    </>
                  )}

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
                                    {isResolvingEns && resolvingEnsName ? `Resolving ${resolvingEnsName}...` : (showErrorPlaceholder ? 
                                      (transferMode === "send" ? "Not an Ethereum address!" : "Not a Tron address!") : 
                                      (transferMode === "send" ? "ENS or Address" : "Tron Address"))}
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
                    className={`w-full py-4 rounded-[24px] text-2xl font-medium bg-black text-white transition-colors flex justify-center items-center ${
                      buttonDisabled ? 'hover:bg-gray-300 hover:text-gray-500 cursor-not-allowed' : ''
                    }`}
                    onClick={handleButtonClick}
                    disabled={buttonDisabled}
                  >
                    {isSwapping ? (
                      <Loader2 className="animate-spin w-6 h-6" />
                    ) : (
                      transferMode === "receive" ? (connectedAddress ? "Send" : "Connect Wallet") : "Untron"
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
        chains={transferMode === "receive" ? receiveChains : OUTPUT_CHAINS}
        selectedChainId={selectedChain.id}
        onSelect={(c) => setSelectedChain(c)}
        onClose={() => setIsChainSelectorOpen(false)}
        showTokenSelector={transferMode === "receive"}
        selectedToken={selectedToken}
        onSelectToken={setSelectedToken}
        userTokens={userTokens}
      />
    </div>
  )
}
