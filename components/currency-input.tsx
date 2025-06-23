import Image from "next/image"
import { ChevronDown } from "lucide-react"
import { ChangeEvent, useState, useEffect } from "react"
import { stringToUnits, DEFAULT_DECIMALS, unitsToString, convertReceiveToSend, convertSendToReceive, SCALING_FACTOR } from "@/lib/units"

interface CurrencyInputProps {
  label: string
  value: string
  currency: string
  currencyIcon: string
  currencyName?: string
  onChange?: (value: string) => void
  maxUnits?: bigint
  isReceive?: boolean
  swapRateUnits?: bigint
  showMaxOutput?: boolean
  onIconClick?: () => void
  overlayIcon?: string
  balance?: string
  onMaxClick?: () => void
  showMaxButton?: boolean
  isInvalid?: boolean
}

export default function CurrencyInput({ 
  label, 
  value: initialValue = "", 
  currency, 
  currencyIcon, 
  currencyName,
  onChange,
  maxUnits,
  isReceive = false,
  swapRateUnits,
  showMaxOutput = false,
  onIconClick,
  overlayIcon,
  balance,
  onMaxClick,
  showMaxButton = false,
  isInvalid = false,
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState(initialValue)
  const [showMaxWarning, setShowMaxWarning] = useState(false)
  
  // Synchronize when the parent updates value
  useEffect(() => {
    setInputValue(initialValue)
  }, [initialValue])
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal point
    const newValue = e.target.value.replace(/[^0-9.]/g, '')
    
    // Prevent multiple decimal points
    if (newValue.split('.').length > 2) {
      return
    }

    // For receive input, calculate the send amount
    if (isReceive && swapRateUnits && newValue) {
      try {
        const receiveUnits = stringToUnits(newValue, DEFAULT_DECIMALS)
        // Calculate send units using helper (rounded)
        const sendUnits = convertReceiveToSend(receiveUnits, swapRateUnits)
        const sendValue = unitsToString(sendUnits, DEFAULT_DECIMALS)
        
        // Validate against maximum output liquidity (receive side)
        if (typeof maxUnits === "bigint" && maxUnits > 0n) {
          const exceeds = receiveUnits > maxUnits
          setShowMaxWarning(exceeds)
          if (exceeds) {
            // Correct receive value to the maximum allowed (rounded down to integer)
            const maxReceiveDisplay = (maxUnits / SCALING_FACTOR).toString()

            // Calculate corresponding send amount that yields this maximum receive
            const maxInputUnits = convertReceiveToSend(maxUnits, swapRateUnits)
            const maxInputDisplay = (maxInputUnits / SCALING_FACTOR).toString()

            // Update receive field
            setInputValue(maxReceiveDisplay)

            // Propagate corrected send amount to parent
            if (onChange) {
              onChange(maxInputDisplay)
            }

            // Hide the warning after auto-correction
            setShowMaxWarning(false)
            return
          }
        }
        
        setInputValue(newValue)
        if (onChange) {
          onChange(sendValue)
        }
        return
      } catch (e) {
        return
      }
    }

    // For send input, validate against maximum output liquidity
    if (!isReceive && typeof maxUnits === "bigint" && maxUnits > 0n && newValue) {
      try {
        const sendUnits = stringToUnits(newValue, DEFAULT_DECIMALS)
        // Ensure we have rate to convert output
        if (!swapRateUnits) {
          throw new Error('swapRateUnits missing')
        }

        const outputUnits = convertSendToReceive(sendUnits, swapRateUnits)
        const exceeds = outputUnits > maxUnits
        setShowMaxWarning(exceeds)

        if (exceeds) {
          // Calculate the maximum input value that would result in maxUnits output
          const maxInputUnits = convertReceiveToSend(maxUnits, swapRateUnits)
          const maxInputDisplay = (maxInputUnits / SCALING_FACTOR).toString()
          setInputValue(maxInputDisplay)
          if (onChange) {
            onChange(maxInputDisplay)
          }
          setShowMaxWarning(false)
          return
        }
      } catch (e) {
        // On conversion error, show generic
        return
      }
    }

    // For receive input, directly compare receive units to max liquidity
    if (isReceive && typeof maxUnits === "bigint" && maxUnits > 0n && newValue) {
      const receiveUnits = stringToUnits(newValue, DEFAULT_DECIMALS)
      const exceeds = receiveUnits > maxUnits
      setShowMaxWarning(exceeds)
      if (exceeds) {
        // Correct receive value to the maximum allowed (rounded down to integer)
        const maxReceiveDisplay = (maxUnits / SCALING_FACTOR).toString()

        setInputValue(maxReceiveDisplay)

        // Propagate same value (best we can without rate)
        if (onChange) {
          onChange(maxReceiveDisplay)
        }

        // Hide the warning after auto-correction
        setShowMaxWarning(false)
        return
      }
    }
    
    setInputValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div className="bg-card rounded-[40px] pl-6 pr-[15px] w-full max-w-[560px] flex items-center h-[118px]">
      <div className="flex-1">
        <div className="flex items-center">
          <label
            htmlFor={`currency-input-${currency}`}
            className="text-[18px] font-normal text-foreground leading-none"
          >
            {label}
          </label>
          {showMaxButton && onMaxClick && (
            <button
              onClick={onMaxClick}
              className="text-xs font-medium text-foreground/60 hover:text-foreground/80 transition-colors ml-2 px-2 py-1 rounded-md bg-foreground/5 hover:bg-foreground/10"
            >
              Max
            </button>
          )}
        </div>
        <input
          id={`currency-input-${currency}`}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={balance || "0.0"}
          className={`text-[36px] font-semibold outline-none w-full p-0 leading-none placeholder:text-[#B5B5B5] ${isInvalid ? 'text-red-500' : 'text-foreground'}`}
        />
        {showMaxOutput && showMaxWarning && typeof maxUnits === "bigint" && maxUnits > 0n && (
          <div className="text-xs text-red-500 mt-1">
            Maximum output is {unitsToString(maxUnits, DEFAULT_DECIMALS)} USDT
          </div>
        )}
      </div>
      {/* Right-hand selectable chain / icon */}
      {onIconClick ? (
        <div
          className="flex items-center justify-center py-[5px] pl-[24px] pr-[5px] cursor-pointer"
          onClick={onIconClick}
        >
          <div className="flex items-center bg-[#F2F2F4] rounded-[25px] px-3 py-2 space-x-2">
            {/* Chevron */}
            <ChevronDown className="w-6 h-6 text-foreground" />
            {/* Icon */}
            <div className="relative w-12 h-12">
              <Image
                src={currencyIcon || "/placeholder.svg"}
                alt={currencyName || "Currency"}
                fill
                className="object-contain"
              />
              {overlayIcon && (
                <div className="absolute bottom-[-8px] right-[-8px] w-[30px] h-[30px]">
                  {/* White circle background */}
                  <div className="absolute top-0 left-0 w-full h-full bg-white rounded-full" />
                  {/* Overlay Icon */}
                  <img
                    src={overlayIcon}
                    alt="Chain"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[26px] h-[26px] object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-[5px] pl-[24px] pr-[17px]">
          <div className="relative w-12 h-12">
            <Image
              src={currencyIcon || "/placeholder.svg"}
              alt={currencyName || "Currency"}
              fill
              className="object-contain"
            />
            {overlayIcon && (
              <div className="absolute bottom-[-8px] right-[-8px] w-[30px] h-[30px]">
                {/* White circle background */}
                <div className="absolute top-0 left-0 w-full h-full bg-white rounded-full" />
                {/* Overlay Icon */}
                <img
                  src={overlayIcon}
                  alt="Chain"
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[26px] h-[26px] object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
