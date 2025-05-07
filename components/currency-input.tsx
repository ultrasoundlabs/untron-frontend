import Image from "next/image"
import { ChangeEvent, useState, useEffect } from "react"
import { stringToUnits, DEFAULT_DECIMALS, unitsToString, convertReceiveToSend } from "@/lib/units"

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
  swapRateUnits
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  
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
        
        // Validate against max amount if provided
        if (typeof maxUnits === "bigint" && maxUnits > 0n) {
          if (sendUnits > maxUnits) {
            const maxDisplay = unitsToString(maxUnits, DEFAULT_DECIMALS)
            setError(`Maximum amount is ${maxDisplay} USDT`)
            return
          }
        }
        
        setError(null)
        setInputValue(newValue)
        if (onChange) {
          onChange(sendValue)
        }
        return
      } catch (e) {
        setError("Invalid amount")
        return
      }
    }

    // For send input, validate against max amount if provided
    if (typeof maxUnits === "bigint" && maxUnits > 0n && newValue) {
      const newUnits = stringToUnits(newValue, DEFAULT_DECIMALS)

      if (newUnits > maxUnits) {
        // Convert maxUnits back to display string for message
        const maxDisplay = unitsToString(maxUnits, DEFAULT_DECIMALS)
        setError(`Maximum amount is ${maxDisplay} USDT`)
        // Auto-adjust to max value, rounded down to the nearest integer
        const maxInt = Math.floor(Number(maxDisplay))
        const adjustedValue = maxInt.toString()
        setInputValue(adjustedValue)
        if (onChange) {
          onChange(adjustedValue)
        }
        return
      } else {
        setError(null)
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
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
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
