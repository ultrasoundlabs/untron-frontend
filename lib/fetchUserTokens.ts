import { OUTPUT_CHAINS } from "@/config/chains"
import { SUPPORTED_TOKENS } from "@/config/tokens"
import { createPublicClient, http, Address, erc20Abi } from "viem"

export interface UserToken {
  /** e.g. "USDC" */
  symbol: string
  /** Chain ID where the token lives */
  chainId: number
  /** Display name of the chain (derived from OUTPUT_CHAINS) */
  chainName: string
  /** URL to a token logo */
  icon: string
  balanceFormatted: string // human-readable amount
  balanceUsd: number
}

// Minimal RPC mapping for the chains we care about. In production replace with your own endpoints.
const RPC_ENDPOINTS: Record<number, string> = {
  8453: "https://mainnet.base.org", // Base
  10: "https://mainnet.optimism.io", // OP Mainnet
  42161: "https://arb1.arbitrum.io/rpc", // Arbitrum One
  480: "https://rpc.worldchain.build", // World Chain (placeholder)
  130: "https://rpc.unichain.world", // Unichain (placeholder)
}

/**
 * Reads on-chain balances for the predefined USDT/USDC set using public RPC endpoints.
 * No API keys are required. Returns only tokens with a non-zero balance.
 */
export async function fetchUserTokens(address: Address): Promise<UserToken[]> {
  const tokensToCheck = SUPPORTED_TOKENS

  const balances = await Promise.all(
    tokensToCheck.map(async (token) => {
      const rpc = RPC_ENDPOINTS[token.chainId]
      if (!rpc || token.contract === "0x0000000000000000000000000000000000000000") return 0n

      try {
        const client = createPublicClient({ transport: http(rpc), chain: undefined })
        const raw = await client.readContract({
          address: token.contract,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        }) as bigint
        return raw > 0n ? { token, balance: raw } : null
      } catch {
        return null
      }
    })
  )

  const result = balances
    .filter((entry): entry is { token: typeof SUPPORTED_TOKENS[number]; balance: bigint } => !!entry)
    .map(({ token, balance }) => {
      // convert balance to float string with decimals
      const units = Number(balance) / 10 ** token.decimals
      const price = token.symbol === "USDT" || token.symbol === "USDC" ? 1 : 0 // other tokens price unknown
      const balanceUsd = units * price
      return {
        symbol: token.symbol,
        chainId: token.chainId,
        chainName: OUTPUT_CHAINS.find((c) => c.id === token.chainId)?.name || "Unknown",
        icon: token.icon,
        balanceFormatted: units.toLocaleString(undefined, { maximumFractionDigits: 6 }),
        balanceUsd,
      }
    })

  // sort by USD desc
  result.sort((a, b) => b.balanceUsd - a.balanceUsd)

  return result
} 