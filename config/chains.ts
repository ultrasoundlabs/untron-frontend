export interface OutputChain {
  id: number
  name: string
  icon: string
  fixedFeeUsd: bigint // expressed with 6 decimals just like token units (e.g. 1 USDT => 1_000_000n)
}

// Hard-coded list of output chains that users can select when receiving funds.
export const OUTPUT_CHAINS: OutputChain[] = [
  {
    id: 8453,
    name: "Base",
    icon: "/chains/Base.svg",
    fixedFeeUsd: 0n,
  },
  {
    id: 42161,
    name: "Arbitrum",
    icon: "/chains/Arbitrum.svg",
    fixedFeeUsd: 0n,
  },
  {
    id: 1,
    name: "Ethereum",
    icon: "/chains/Ethereum.svg",
    fixedFeeUsd: 1_000_000n,
  },
  {
    id: 57073,
    name: "Ink",
    icon: "/chains/Ink.svg",
    fixedFeeUsd: 0n,
  },
  {
    id: 1135,
    name: "Lisk",
    icon: "/chains/Lisk.svg",
    fixedFeeUsd: 0n,
  },
  {
    id: 34443,
    name: "Mode",
    icon: "/chains/Mode.svg",
    fixedFeeUsd: 0n,
  },
  {
    id: 10,
    name: "OP Mainnet",
    icon: "/chains/OPMainnet.svg",
    fixedFeeUsd: 0n,
  },
  {
    id: 1868,
    name: "Soneium",
    icon: "/chains/Soneium.svg",
    fixedFeeUsd: 0n,
  },
  {
    id: 1923,
    name: "Swell",
    icon: "/chains/Swell.svg",
    fixedFeeUsd: 0n,
  },
  {
    id: 130,
    name: "Unichain",
    icon: "/chains/Unichain.svg",
    fixedFeeUsd: 0n,
  },
  {
    id: 480,
    name: "World Chain",
    icon: "/chains/WorldChain.svg",
    fixedFeeUsd: 0n,
  },
]