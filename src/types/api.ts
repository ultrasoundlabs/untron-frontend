/**
 * Type definitions for API responses and requests
 */

/**
 * Represents a supported asset
 */
export interface Asset {
    symbol: string;
    network: string;
    chainId: number;
    tokenAddress: string;
    decimals: number;
}

/**
 * Represents an exchange rate
 */
export interface Rate {
    fromToken: Asset;
    rate: number;
}

/**
 * Represents fee information
 */
export interface Fee {
    symbol: string;
    network: string;
    chainId: number;
    tokenAddress: string;
    flatFee: number;
    percentFee: number;
}

/**
 * Represents token information
 */
export interface TokenInfo {
    symbol: string;
    tokenAddress: string;
    decimals: number;
    flatFee: number;
    percentFee: number;
}

/**
 * Represents network information
 */
export interface NetworkInfo {
    network: string;
    chainId: number;
    contractAddress: string;
    rpcUrl: string;
    tokens: TokenInfo[];
}

/**
 * Represents general information
 */
export interface Information {
    maxOutputAmount: number;
    supportedNetworks: NetworkInfo[];
}

/**
 * Represents a token permit for gasless transactions
 */
export interface TokenPermit {
    deadline: string;
    r: string;
    s: string;
    v: number;
}

/**
 * Represents an intent input
 */
export interface IntentInput {
    amount: string;
    token: string;
}

/**
 * Represents the intent data for the swap
 */
export interface IntentData {
    inputs: IntentInput[];
    outputAmount: string;
    refundBeneficiary: string;
    to: string;
}

/**
 * Represents a swap request
 */
export interface SwapRequest {
    chainId: number;
    permitData: string;
    swapData: string;
    signature: string;
}

/**
 * Represents a swap response
 */
export interface SwapResponse {
    status: string;
    fromToken: Asset;
    amountSent: string;
    toToken: Asset;
    amountReceived: string;
    transactionHash: string;
    timestamp: string;
}

/**
 * Custom error type for handling errors
 */
export interface ErrorResponse {
    error: string;
}

/**
 * Rate response type
 */
export interface RateResponse {
    rate: number;
}
