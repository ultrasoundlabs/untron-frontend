import { OutputChain } from "@/config/chains"
import { motion, AnimatePresence } from "motion/react"
import { useState, useEffect } from "react"
import { unitsToString, DEFAULT_DECIMALS } from "@/lib/units"
import { UserToken } from "@/lib/fetchUserTokens"
import { SUPPORTED_TOKENS } from "@/config/tokens"

interface ChainSelectorProps {
  open: boolean
  chains: OutputChain[]
  selectedChainId: number
  onSelect: (chain: OutputChain) => void
  onClose: () => void
  /** When true, shows the token selector instead of a pure network selector. */
  showTokenSelector?: boolean
  /** List of tokens to show when showTokenSelector = true. If omitted, falls back to USDT/USDC. */
  userTokens?: UserToken[]
  /** Currently selected token symbol (used for checkmark). */
  selectedToken?: string
  /** Callback when a token is picked. */
  onSelectToken?: (tokenSymbol: string) => void
  /** When provided, selector will also render tokens the user doesn't own under "Other available". */
  showOtherAvailable?: boolean
}

export default function ChainSelector({
  open,
  chains,
  selectedChainId,
  onSelect,
  onClose,
  showTokenSelector = false,
  userTokens = [],
  selectedToken: controlledToken,
  onSelectToken,
  showOtherAvailable = true,
}: ChainSelectorProps) {
  const [internalToken, setInternalToken] = useState<string>(controlledToken ?? "USD₮0")
  // Keep internal state in sync with the controlled prop
  useEffect(() => {
    // Only update when a new controlledToken value is provided
    if (controlledToken !== undefined && controlledToken !== internalToken) {
      setInternalToken(controlledToken)
    }
  }, [controlledToken])
  // The token that is highlighted as selected
  const selectedToken = controlledToken ?? internalToken

  // deduce 'other' tokens list
  const otherTokens: UserToken[] = showOtherAvailable
    ? SUPPORTED_TOKENS.filter((t) => !userTokens.some((u) => u.symbol === t.symbol && u.chainId === t.chainId)).map((t) => ({
        symbol: t.symbol,
        chainId: t.chainId,
        chainName: chains.find((c) => c.id === t.chainId)?.name || "Unknown",
        icon: t.icon,
        balanceFormatted: "",
        balanceUsd: 0,
      }))
    : []

  const handleTokenClick = (tokenSymbol: string, chainId?: number) => {
    if (!controlledToken) {
      setInternalToken(tokenSymbol)
    }
    if (onSelectToken) onSelectToken(tokenSymbol)
    // If a chainId is passed, also switch the chain so the parent stays in sync
    if (chainId) {
      const chain = chains.find((c) => c.id === chainId)
      if (chain) onSelect(chain)
    }
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-[48px] px-[20px] pt-[28px] pb-0 w-full max-w-[400px] mx-4 h-[434px] flex flex-col overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3 pl-2">
              <h3 className="text-xl font-medium font-geist">{showTokenSelector ? "Select token" : "Select network"}</h3>
              <div className="relative">
                <button 
                  className="relative w-10 h-10 flex items-center justify-center focus:outline-none group" 
                  onClick={onClose}
                >
                  <div className="absolute inset-0 rounded-full bg-transparent group-hover:bg-[#F5F5F7] w-10 h-10"></div>
                  <img src="/close.svg" alt="Close" width={48} height={48} className="relative z-10" />
                </button>
              </div>
            </div>
            {showTokenSelector ? (
              // -------- USER TOKEN LIST MODE --------
              <div className="space-y-0 overflow-y-auto pr-2 pb-[28px] flex-1">
                {userTokens.length > 0 && (
                  <h4 className="text-base font-normal text-[#8d8d8d] pb-1 pl-2 font-geist">My tokens</h4>
                )}
                {userTokens.map((token) => {
                  const chainInfo = chains.find(c => c.id === token.chainId)
                  return (
                    <button
                      key={`${token.chainId}-${token.symbol}`}
                      className="w-full flex items-center justify-between py-2 pl-2 pr-1 rounded-[16px] hover:bg-[#F5F5F7] transition-colors"
                      onClick={() => handleTokenClick(token.symbol, token.chainId)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <img src={token.icon} alt={token.symbol} className="w-10 h-10 rounded-full" style={{width:40,height:40}} />
                          {chainInfo && (
                            <img src={chainInfo.icon} alt="chain" className="absolute -bottom-1.5 -right-1.5 rounded-full border-2 border-white bg-white" style={{width:24,height:24}} />
                          )}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-lg font-normal text-black font-geist">{token.symbol}</span>
                          <span className="text-sm text-[#8d8d8d] font-geist">{token.chainName}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end mr-2">
                        <span className="text-lg font-normal text-black font-geist">${token.balanceUsd.toFixed(2)}</span>
                        <span className="text-sm text-[#8d8d8d] font-geist">{token.balanceFormatted}</span>
                      </div>
                    </button>
                  )
                })}

                {otherTokens.length > 0 && (
                  <>
                    <h4 className="text-base font-normal text-[#8d8d8d] pt-6 pb-1 pl-2 font-geist">Other available</h4>
                    {otherTokens.map((token) => {
                      const chainInfo = chains.find((c) => c.id === token.chainId)
                      return (
                        <button
                          key={`other-${token.chainId}-${token.symbol}`}
                          className="w-full flex items-center justify-between py-2 pl-2 pr-1 rounded-[16px] hover:bg-[#F5F5F7] transition-colors"
                          onClick={() => handleTokenClick(token.symbol, token.chainId)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <img src={token.icon} alt={token.symbol} className="rounded-full" style={{width:40,height:40}} />
                              {chainInfo && (
                                <img src={chainInfo.icon} alt="chain" className="absolute -bottom-1.5 -right-1.5 rounded-full border-2 border-white bg-white" style={{width:24,height:24}} />
                              )}
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-lg font-normal text-black font-geist">{token.symbol}</span>
                              <span className="text-sm text-[#8d8d8d] font-geist">{token.chainName}</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </>
                )}
              </div>
            ) : (
              // -------- DEFAULT NETWORK LIST MODE --------
              <div className="space-y-0 overflow-y-auto pr-2 pb-[28px] flex-1">
                {chains.map((chain) => (
                  <button
                    key={chain.id}
                    className="w-full flex items-center justify-between py-2 pl-2 pr-1 rounded-[16px] hover:bg-[#F5F5F7] transition-colors"
                    onClick={() => {
                      onSelect(chain)
                      onClose()
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <img src={chain.icon} alt={chain.name} className="w-10 h-10" />
                      <div className="flex flex-col items-start">
                        <span className="text-lg font-normal text-black font-geist">{chain.name}</span>
                        {chain.fixedFeeUsd > 0n && (
                          <span className="text-sm text-gray-500 font-geist">
                            {unitsToString(chain.fixedFeeUsd, DEFAULT_DECIMALS)} USDT fee
                          </span>
                        )}
                      </div>
                    </div>
                    {chain.id === selectedChainId && (
                      <img src="/check.svg" alt="Selected" width={24} height={24} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 