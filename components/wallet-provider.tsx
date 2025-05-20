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
    [mainnet.id]: http("https://ethereum-rpc.publicnode.com"), // whatever RPC RainbowKit provides by default is fascist
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
          coolMode
        >{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 