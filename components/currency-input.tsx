import Image from "next/image"
import { ChangeEvent, useState } from "react"

interface CurrencyInputProps {
  label: string
  value: string
  currency: string
  currencyIcon: string
  currencyName?: string
  onChange?: (value: string) => void
}

export default function CurrencyInput({ 
  label, 
  value: initialValue = "", 
  currency, 
  currencyIcon, 
  currencyName,
  onChange
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState(initialValue)
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal point
    const newValue = e.target.value.replace(/[^0-9.]/g, '')
    
    // Prevent multiple decimal points
    if (newValue.split('.').length > 2) {
      return
    }
    
    setInputValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div className="bg-card rounded-[44px] pl-6 pr-[15px] w-full max-w-[560px] flex items-center h-[135px]">
      <div className="flex-1">
        <p className="text-[18px] font-normal text-foreground mb-0 leading-none">{label}</p>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="0.0"
          className="text-[36px] font-semibold outline-none w-full text-foreground p-0 leading-none placeholder:text-muted-foreground"
        />
        <p className="text-normal text-muted-foreground mt-[0px] leading-none">{currency}</p>
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
