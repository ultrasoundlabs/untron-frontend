import { Address } from "viem"

export interface SupportedToken {
  chainId: number
  symbol: "USDT" | "USDC"
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
    icon: "/usdc.svg",
  },
  {
    chainId: 8453,
    symbol: "USDT",
    // TODO: Replace with official address once available on Base.
    contract: "0x0000000000000000000000000000000000000000",
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
    icon: "/usdc.svg",
  },
  {
    chainId: 10,
    symbol: "USDT",
    contract: "0x94b008Aa00579c1307B0EF2c499aD98a8ce58e58",
    decimals: 6,
    icon: "/USDT.svg",
  },

  // Arbitrum One (42161)
  {
    chainId: 42161,
    symbol: "USDC",
    // Native USDC on Arbitrum
    contract: "0xAf88d065e77c8cC2239327C5EDb3A432268e5831",
    decimals: 6,
    icon: "/usdc.svg",
  },
  {
    chainId: 42161,
    symbol: "USDT",
    contract: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69fcBB9",
    decimals: 6,
    icon: "/USDT.svg",
  },

  // World Chain (480) – placeholder values, update when mainnet info is public
  {
    chainId: 480,
    symbol: "USDC",
    // Bridged USDC (USDC.E) on World Chain Mainnet
    contract: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
    decimals: 6,
    icon: "/usdc.svg",
  },
  {
    chainId: 480,
    symbol: "USDT",
    contract: "0x0000000000000000000000000000000000000000",
    decimals: 6,
    icon: "/USDT.svg",
  },

  // Unichain (130) – placeholder values
  {
    chainId: 130,
    symbol: "USDC",
    // Native USDC on Unichain Mainnet
    contract: "0x078D782b760474a361dDA0AF3839290b0EF57AD6",
    decimals: 6,
    icon: "/usdc.svg",
  },
  {
    chainId: 130,
    symbol: "USDT",
    // Native USDT on Unichain Mainnet
    contract: "0x9151434b16b9763660705744891fA906F660EcC5",
    decimals: 6,
    icon: "/USDT.svg",
  },
] 