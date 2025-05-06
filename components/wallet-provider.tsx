"use client"

import React, { ReactNode, useState } from "react"
import { WagmiProvider, http } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { darkTheme, getDefaultConfig, lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { mainnet } from "wagmi/chains"

interface WalletProviderProps {
  children: ReactNode
}

// Configure wagmi + RainbowKit
const wagmiConfig = getDefaultConfig({
  appName: "Untron",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID",
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  ssr: true,
})

export default function WalletProvider({ children }: WalletProviderProps) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: "#000000",
            accentColorForeground: "#ffffff",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 