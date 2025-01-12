/**
 * Types specific to the frontend UI that are not part of the API
 */

export interface Transaction {
    url?: string;
    timestamp?: number;
    orderSignedAt?: number;
    // Add other relevant properties
}

export interface AssetDisplayOption {
    key: string;
    symbol: string;
    icon: string;
}

export interface AssetWithFees {
    symbol: string;
    network: string;
    chainId: number;
    contractAddress: `0x${string}`;
    tokenAddress: `0x${string}`;
    decimals: number;
    icon: string;
    flatFee: number;
    percentFee: number;
}

export interface ChainFees {
    flatFee: number;
    percentFee: number;
    contractAddress: `0x${string}`;
    tokenAddress: `0x${string}`;
    decimals: number;
}
