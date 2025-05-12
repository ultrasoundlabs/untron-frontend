export const API_BASE_URL = 'https://untron.finance/api/v2'

export interface ApiInfoResponse {
  availableLiquidity: number
  availableReceivers: string[]
  retryAtS: number
}

// Swap rate represented in smallest units (6 decimals) to avoid floats: 0.9997 -> 999700 / 1_000_000
// Swap rate is hardcoded for now but can be easily changed to use API in the future
export const SWAP_RATE_UNITS: bigint = 999700n;