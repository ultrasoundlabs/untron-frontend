"use client"

import React, { ReactNode, useState } from "react"
import { WagmiProvider, http } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { darkTheme, getDefaultConfig, lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { base, optimism, arbitrum, mainnet } from "wagmi/chains"
import { Chain } from "@rainbow-me/rainbowkit"

interface WalletProviderProps {
  children: ReactNode
}

// Custom chain definitions for World Chain (id 480) and Unichain (id 130)
const worldChain = {
  id: 480,
  name: "World Chain",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://worldchain-mainnet.g.alchemy.com/public"] },
  },
  blockExplorers: {
    default: { name: "Worldscan", url: "https://worldscan.org" },
  },
} as const satisfies Chain;

const unichain = {
  id: 130,
  name: "Unichain",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://mainnet.unichain.org"] },
  },
  blockExplorers: {
    default: { name: "Uniscan", url: "https://uniscan.xyz" },
  },
} as const satisfies Chain;

// List of chains used across the dApp (receive mode chains)
const chains = [base, optimism, arbitrum, unichain, worldChain, mainnet] as const;

// Configure wagmi + RainbowKit
const wagmiConfig = getDefaultConfig({
  appName: "Untron",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID",
  chains,
  transports: {
    [base.id]: http("https://mainnet.base.org"),
    [optimism.id]: http("https://mainnet.optimism.io"),
    [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
    [unichain.id]: http("https://mainnet.unichain.org"),
    [worldChain.id]: http("https://worldchain-mainnet.g.alchemy.com/public"),
    [mainnet.id]: http("https://ethereum-rpc.publicnode.com"),
  },
  ssr: true,
})

// Custom theme
const customLightTheme = lightTheme({
  accentColor: "#000000", // Primary accent color for buttons
  accentColorForeground: "#ffffff", // Text color on accent background
  borderRadius: "large", // Border radius for buttons
  fontStack: "system", 
  overlayBlur: "small",
});

const customDarkTheme = darkTheme({
  accentColor: "#ffffff", // Primary accent color for buttons
  accentColorForeground: "#000000", // Text color on accent background
  borderRadius: "large", // Border radius for buttons
  fontStack: "system",
  overlayBlur: "small",
});

export default function WalletProvider({ children }: WalletProviderProps) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={{
            lightMode: customLightTheme,
            darkMode: customDarkTheme,
          }}
          modalSize="compact"
          initialChain={base.id}
          coolMode
        >{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 