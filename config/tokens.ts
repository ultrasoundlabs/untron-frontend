import { Address } from "viem"

export interface SupportedToken {
  chainId: number
  symbol: "USD₮0" | "USDC"
  contract: Address
  decimals: number
  icon: string
}

export const SUPPORTED_TOKENS: SupportedToken[] = [
  // Base Mainnet (8453)
  {
    chainId: 8453,
    symbol: "USDC",
    // Native USDC on Base
    contract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    icon: "/USDC.svg",
  },
  /*
  {
    chainId: 8453,
    symbol: "USD₮0",
    contract: "0x102d758f688a4C1C5a80b116bD945d4455460282",
    decimals: 6,
    icon: "/USDT.svg",
  },

  // Optimism Mainnet (10)
  {
    chainId: 10,
    symbol: "USDC",
    // Native USDC on OP Mainnet
    contract: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    decimals: 6,
    icon: "/USDC.svg",
  },
  {
    chainId: 10,
    symbol: "USD₮0",
    contract: "0x01bFF41798a0BcF287b996046Ca68b395DbC1071",
    decimals: 6,
    icon: "/USDT.svg",
  },

  // Arbitrum One (42161)
  {
    chainId: 42161,
    symbol: "USDC",
    // Native USDC on Arbitrum
    contract: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    decimals: 6,
    icon: "/USDC.svg",
  },
  {
    chainId: 42161,
    symbol: "USD₮0",
    contract: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    decimals: 6,
    icon: "/USDT.svg",
  },

  // World Chain (480) 
  {
    chainId: 480,
    symbol: "USDC",
    contract: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
    decimals: 6,
    icon: "/USDC.svg",
  },
  {
    chainId: 480,
    symbol: "USD₮0",
    contract: "0x102d758f688a4C1C5a80b116bD945d4455460282",
    decimals: 6,
    icon: "/USDT.svg",
  },

  // Unichain (130) 
  {
    chainId: 130,
    symbol: "USDC",
    contract: "0x078D782b760474a361dDA0AF3839290b0EF57AD6",
    decimals: 6,
    icon: "/USDC.svg",
  },
  {
    chainId: 130,
    symbol: "USD₮0",
    contract: "0x9151434b16b9763660705744891fA906F660EcC5",
    decimals: 6,
    icon: "/USDT.svg",
  },
  */
] 