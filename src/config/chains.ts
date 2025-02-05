export interface TokenConfig {
    symbol: string;
    tokenAddress: `0x${string}`;
    contractAddress: `0x${string}`; // used for swapping (the "spender")
    decimals: number;
    // Hardcoded conversion rate (e.g. USDC is pegged to 1 USD)
    rate: number;
    // Hardcoded fee structure
    flatFee: number;
    percentFee: number;
    // Asset paths
    iconPath: string;
}

export interface ChainConfig {
    chainId: number;
    name: string;
    tokens: TokenConfig[];
    iconPath: string;
}

export const chains: ChainConfig[] = [
    {
        chainId: 8453, // Base Mainnet
        name: 'Base',
        iconPath: 'images/chains/base.svg',
        tokens: [
            {
                symbol: 'USDT',
                tokenAddress: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as `0x${string}`,
                contractAddress: '0xeD6ABc392D9B38747F5CE11f451df592D591565b' as `0x${string}`,
                decimals: 6,
                rate: 1, // USDT = 1 USDT
                flatFee: 0.5,
                percentFee: 0,
                iconPath: 'images/usdt.svg',
            },
            {
                symbol: 'USDC',
                tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
                contractAddress: '0xeD6ABc392D9B38747F5CE11f451df592D591565b' as `0x${string}`,
                decimals: 6,
                rate: 1, // USDC = 1 USDT
                flatFee: 0.5,
                percentFee: 0,
                iconPath: 'images/usdc.png',
            },
        ],
    },
]; 