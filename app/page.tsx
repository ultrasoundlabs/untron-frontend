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
import { useAccount, useDisconnect, useConfig, useChainId, useSwitchChain } from "wagmi"
import { untronInfo, untronCreate } from "@/lib/untron-api"
import { stringToUnits, unitsToString, DEFAULT_DECIMALS, convertSendToReceive, RATE_SCALE } from "@/lib/units"
import { getEnsAddress } from '@wagmi/core'
import { mainnet } from 'wagmi/chains'
import { normalize } from 'viem/ens'
import { getAddress } from 'viem'
import { OUTPUT_CHAINS, OutputChain } from "@/config/chains"
import ChainSelector from "@/components/chain-selector"
import ChainButton from "@/components/chain-button"
import ModeSwitcher, { TransferMode } from "@/components/mode-switcher"
import { fetchUserTokens, UserToken } from "@/lib/fetchUserTokens"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { readContract, signTypedData } from "@wagmi/core"
import { toast } from "sonner"
import { SUPPORTED_TOKENS } from "@/config/tokens"
import { SuccessPopup } from "@/components/untron/success-popup"

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
const FROM_TRON_FEE_BPS = 10n; // 10 basis points (0.1%)
const INTO_TRON_STATIC_FEE: bigint = 2_000_000n; // 2 USDT/USDC (6-decimals)
const INTO_TRON_MAX_AMOUNT: bigint = 1_000_000_000n; // 1,000 USDT/USDC (6-decimals)

// Rate units after 10 bps fee: 1e6 * (1 - feeBps/10000)
const FROM_TRON_RATE_UNITS: bigint = RATE_SCALE - (RATE_SCALE * FROM_TRON_FEE_BPS) / 10000n;

// Helper: convert desired receiveUnits back to required sendUnits using swap rate
const computeSendUnitsFromReceiveFromTron = (receiveUnits: bigint): bigint => {
  // send = ceil(receive * 10000 / (10000 - feeBps))
  const numerator = receiveUnits * 10000n;
  const denominator = 10000n - FROM_TRON_FEE_BPS;
  return (numerator + denominator - 1n) / denominator;
};

// Minimal ABI fragments to fetch token metadata required for the EIP-712 domain
const ERC20_NAME_ABI = [{
  constant: true,
  inputs: [],
  name: "name",
  outputs: [{ name: "", type: "string" }],
  stateMutability: "view",
  type: "function",
}] as const

const ERC20_VERSION_ABI = [{
  constant: true,
  inputs: [],
  name: "version",
  outputs: [{ name: "", type: "string" }],
  stateMutability: "view",
  type: "function",
}] as const

// Helper to generate a random 32-byte nonce returned as 0x-prefixed hex
const randomHex32 = (): `0x${string}` => {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`
}

// Helper to safely fetch token metadata (falls back to sensible defaults)
const fetchTokenMetadata = async (
  config: ReturnType<typeof useConfig>,
  chainId: number,
  tokenAddress: `0x${string}`,
  symbol: string,
): Promise<{ name: string; version: string }> => {
  try {
    const name: string = (await readContract(config, {
      chainId,
      address: tokenAddress,
      abi: ERC20_NAME_ABI as any,
      functionName: "name",
      args: [],
    })) as string

    // Attempt to fetch version – many tokens (e.g. USDT) do not implement it.
    let version = "1"
    try {
      version = (await readContract(config, {
        chainId,
        address: tokenAddress,
        abi: ERC20_VERSION_ABI as any,
        functionName: "version",
        args: [],
      })) as string
    } catch {
      // ignore – keep default "1"
    }

    return { name, version }
  } catch {
    // Fallback values for the two supported symbols
    if (symbol === "USDC") return { name: "USD Coin", version: "2" }
    return { name: "Tether USD", version: "3" }
  }
}

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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successTxHash, setSuccessTxHash] = useState<string | undefined>(undefined)
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
  const [selectedToken, setSelectedToken] = useState<string>("USDC")
  const [userTokens, setUserTokens] = useState<UserToken[]>([])
  const { openConnectModal } = useConnectModal();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [amountExceedsBalance, setAmountExceedsBalance] = useState(false)
  const [outputBelowZero, setOutputBelowZero] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  // Allowed chains in RECEIVE mode (ordered)
  const RECEIVE_CHAIN_IDS: number[] = [8453] //, 10, 130, 480, 42161]
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
        const data = await untronInfo()
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
        chainId: mainnet.id,
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
      const fromUnits = stringToUnits(sendAmount, DEFAULT_DECIMALS)

      const order = await untronCreate({
        fromAmount: fromUnits,
        beneficiary: addressBadge,
      })

      if (order?.id) {
        // Trigger exit animations
        setShowArrowAndFaq(false)
        setIsContentHidden(true)

        // Give the exit animations ~0.3s to play before navigation
        setTimeout(() => {
          router.push(`/order/${order.id}`)
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
  const handleSwapIntoTron = async () => {
    if (!addressBadge || !sendAmount || isSwapping || !connectedAddress) return

    setIsSwapping(true)
    setErrorMessage(null)

    try {
      // 1. Convert amount → smallest units
      const sendUnits = stringToUnits(sendAmount, DEFAULT_DECIMALS)

      // 2. Request dedicated receiver address bound to the Tron beneficiary
      const intentResp = await fetch("https://untron.finance/api/intents/receivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tron_address: addressBadge }),
      })

      if (!intentResp.ok) {
        throw new Error(`Intents API returned status ${intentResp.status}`)
      }

      const intentJson: { success: boolean; receiver_address: string | null; error?: string } = await intentResp.json()
      if (!intentJson.success || !intentJson.receiver_address) {
        throw new Error(intentJson.error || "Failed to obtain receiver address")
      }

      const receiverAddress = intentJson.receiver_address as `0x${string}`

      // 3. Prepare typed data for ERC-3009 signature
      const tokenInfo = SUPPORTED_TOKENS.find(
        (t) => t.chainId === selectedChain.id && t.symbol === selectedToken,
      )

      if (!tokenInfo) {
        throw new Error("Selected token is not supported on chosen chain")
      }

      const tokenAddress = tokenInfo.contract as `0x${string}`

      // Fetch token name & version (with fallbacks)
      const { name: tokenName, version: tokenVersion } = await fetchTokenMetadata(
        config,
        selectedChain.id,
        tokenAddress,
        tokenInfo.symbol,
      )

      const validAfter = 0n
      const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600) // 1h
      const nonce = randomHex32()

      const domain = {
        name: tokenName,
        version: tokenVersion,
        chainId: BigInt(selectedChain.id),
        verifyingContract: tokenAddress,
      } as const

      const types = {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      } as const

      const message = {
        from: connectedAddress,
        to: receiverAddress,
        value: sendUnits,
        validAfter,
        validBefore,
        nonce,
      } as const

      // 4. Request signature from the wallet
      const signature = await signTypedData(config, {
        account: connectedAddress as `0x${string}`,
        domain,
        primaryType: "TransferWithAuthorization",
        types,
        message,
      })

      // Split signature into r / s / v
      const sig = signature.slice(2)
      const r = `0x${sig.slice(0, 64)}`
      const s = `0x${sig.slice(64, 128)}`
      const v = parseInt(sig.slice(128, 130), 16)

      // 5. Relay the signed authorization
      const relayBody = {
        chainId: selectedChain.id,
        token: tokenAddress,
        from: connectedAddress,
        to: receiverAddress,
        value: Number(sendUnits.toString()),
        validAfter: Number(validAfter),
        validBefore: Number(validBefore),
        nonce,
        v,
        r,
        s,
      }

      const relayResp = await fetch("https://untron.finance/api/gasless/relay3009", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(relayBody),
      })

      if (!relayResp.ok) {
        const text = await relayResp.text()
        throw new Error(`Relayer error: ${text}`)
      }

      const relayJson: { txHash: string } = await relayResp.json()
      console.log("Relayer tx hash:", relayJson.txHash)

      // 6. Wait 3 seconds then show success popup with Tronscan link
      setTimeout(() => {
        setSuccessTxHash(relayJson.txHash)
        setShowSuccessPopup(true)
      }, 3000)

      // Clear UI
      setSendAmount("")
      setReceiveAmount("")
      setAddressBadge(null)
    } catch (error: any) {
      console.error("L2 → Tron flow failed:", error)
      setErrorMessage(error?.message || "Something went wrong. Please try again.")
    } finally {
      setIsSwapping(false)
    }
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
    if (selectedToken === "USDC") return "/USDC.svg"
    // Generic placeholder
    return "/token-placeholder.svg"
  }, [selectedToken, userTokens])

  // Get the balance for the selected token
  const selectedTokenBalance = useMemo(() => {
    const match = userTokens.find((t) => t.symbol === selectedToken && t.chainId === selectedChain.id)
    return match ? match.balanceFormatted : undefined
  }, [selectedToken, userTokens, selectedChain])

  // Handle max button click
  const handleMaxClick = () => {
    if (selectedTokenBalance) {
      setSendAmount(selectedTokenBalance)
      // Calculate corresponding receive amount
      try {
        const sendUnits = stringToUnits(selectedTokenBalance, DEFAULT_DECIMALS)
        const receiveUnits = sendUnits
        const receiveAfterFee = receiveUnits > INTO_TRON_STATIC_FEE ? receiveUnits - INTO_TRON_STATIC_FEE : 0n
        const newReceiveAmount = unitsToString(receiveAfterFee, DEFAULT_DECIMALS)
        setReceiveAmount(newReceiveAmount)
        setIsReceiveUpdating(true)
        
        // Reset validation since we're setting to max balance
        setAmountExceedsBalance(false)
        setOutputBelowZero(receiveAfterFee === 0n && sendUnits > 0n)
      } catch (e) {
        console.error('Error calculating receive amount:', e)
      }
    }
  }

  const buttonDisabled = useMemo(() => {
    if (transferMode === "receive" && !connectedAddress) {
      return false; // Connect Wallet button should always be clickable
    }
    if (transferMode === "receive" && (amountExceedsBalance || outputBelowZero)) {
      return true; // Disable button if amount validation fails
    }
    return !addressBadge || !sendAmount || isSwapping;
  }, [transferMode, connectedAddress, addressBadge, sendAmount, isSwapping, amountExceedsBalance, outputBelowZero]);

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

  // Automatically prompt the wallet to switch network when the user changes the "send from" chain in RECEIVE (into-Tron) mode
  useEffect(() => {
    if (
      transferMode === "receive" &&
      connectedAddress &&
      selectedChain &&
      chainId !== selectedChain.id &&
      switchChain
    ) {
      try {
        switchChain({ chainId: selectedChain.id })
      } catch (err) {
        console.error("Failed to switch chain:", err)
      }
    }
  }, [transferMode, connectedAddress, selectedChain, chainId, switchChain]);

  // Recalculate validation when amount, token, or chain changes
  useEffect(() => {
    if (transferMode === "receive" && sendAmount) {
      try {
        const sendUnits = stringToUnits(sendAmount, DEFAULT_DECIMALS)
        
        // Check if amount exceeds balance (treat undefined balance as 0)
        const balanceUnits = selectedTokenBalance
          ? stringToUnits(selectedTokenBalance, DEFAULT_DECIMALS)
          : 0n
        setAmountExceedsBalance(sendUnits > balanceUnits)
        
        // Check if output is below zero
        const receiveUnits = sendUnits
        const receiveAfterFee =
          receiveUnits > INTO_TRON_STATIC_FEE ? receiveUnits - INTO_TRON_STATIC_FEE : 0n
        setOutputBelowZero(receiveAfterFee === 0n && sendUnits > 0n)
      } catch (e) {
        setAmountExceedsBalance(false)
        setOutputBelowZero(false)
      }
    } else {
      setAmountExceedsBalance(false)
      setOutputBelowZero(false)
    }
  }, [sendAmount, selectedToken, selectedChain, selectedTokenBalance, transferMode]);

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
                        currencyIcon="/USDC.svg"
                        currencyName="USDC"
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
                        /* onIconClick={() => setIsChainSelectorOpen(true)} */
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
                        /* onIconClick={() => setIsChainSelectorOpen(true)} */
                        overlayIcon={selectedChain.icon}
                        balance={selectedTokenBalance}
                        showMaxButton={true}
                        onMaxClick={handleMaxClick}
                        isInvalid={amountExceedsBalance || outputBelowZero}
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
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                              />
                              <AnimatePresence>
                                {inputValue === "" && !isFocused && (
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

                  <AnimatePresence mode="popLayout">
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

      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        address={addressBadge || ""}
        txHash={successTxHash}
      />
    </div>
  )
}
