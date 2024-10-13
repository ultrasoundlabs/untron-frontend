import React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { base, baseSepolia } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configuration } from './config/config';

console.log(configuration.environment);
const config = createConfig(
    getDefaultConfig({
        // Your dApps chains
        chains: [base],

        transports: {
            // RPC URL for each chain
            // TODO: Put correct RPC URLs
            [baseSepolia.id]: http(`https://sepolia.base.org`),
            [base.id]: http(`https://mainnet.base.org`),
        },

        // Required API Keys
        // TODO: Fix this by using environment variables with dotenv or something similar
        walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID as string,

        // Required App Info
        appName: 'Untron Frontend',

        // Optional App Info
        // TODO: Add app description and icon
        //appDescription: "Untron Frontend",
        //appUrl: "https://family.co", // your app's url
        //appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
    }),
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider>{children}</ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};
