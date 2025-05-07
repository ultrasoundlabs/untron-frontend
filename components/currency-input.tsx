import Image from "next/image"
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
  showMaxOutput = false
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
    <div className="bg-card rounded-[44px] pl-6 pr-[15px] w-full max-w-[560px] flex items-center h-[135px]">
      <div className="flex-1">
        <label 
          htmlFor={`currency-input-${currency}`}
          className="text-[18px] font-normal text-foreground mb-0 leading-none block"
        >
          {label}
        </label>
        <input
          id={`currency-input-${currency}`}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="0.0"
          className="text-[36px] font-semibold outline-none w-full text-foreground p-0 leading-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between">
          <p className="text-normal text-muted-foreground mt-[0px] leading-none">{currency}</p>
        </div>
        {showMaxOutput && showMaxWarning && typeof maxUnits === "bigint" && maxUnits > 0n && (
          <div className="text-xs text-red-500 mt-1">
            Maximum output is {unitsToString(maxUnits, DEFAULT_DECIMALS)} USDT
          </div>
        )}
      </div>
      <div className="flex items-center justify-center pt-[40px] pb-[32px]">
        <Image
          src={currencyIcon || "/placeholder.svg"}
          alt={currencyName || "Currency"}
          width={63}
          height={63}
          className="w-auto h-auto"
        />
      </div>
    </div>
  )
}
