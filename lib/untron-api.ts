import { assert, awaitDebug, base } from "@daimo/pay-common";

// Constants
const UNTRON_RATE = 999000; // 0.1% fee
const UNTRON_API_URL = "/api/untron";
const UNTRON_TO_CHAIN = base.chainId;

// Types
export type UntronOrderStatus = "open" | "closed" | "expired";

export interface UntronCreateOrderResponse {
  id: string;
  /// Order status.
  status: UntronOrderStatus;
  /// Tron TRC-20 receiver address.
  receiver: string;
  /// Total received in USDC units.
  receivedTotal: number;
  /// Unix time at which order expires.
  expiresAtS: number;
}

export interface UntronGetOrderResponse {
  /** Format: "{receiverAddress}/{orderNonce}" */
  id: string;
  /** Order status */
  status: "open" | "closed" | "expired";
  /** ISO timestamp when the order was created */
  createdAt: string;
  /** ISO timestamp when the order was closed, or null if still open */
  closedAt: string | null;
  /** Assets that should be sent *to* Untron */
  from: Array<{
    chain: "tron";
    token: {
      symbol: "USDT";
      /** Tron USDT contract address */
      address: string;
    };
    /** Decimal string with 6 decimals (e.g., "100.000000") */
    amount: string;
  }>;
  /** Assets that will be delivered *from* Untron */
  to: {
    /** Chain ID (e.g., 8453 for Base) */
    chain: number;
    token: {
      symbol: "USDC";
      /** EVM USDC contract address */
      address: string;
    };
    /** Decimal string with 6 decimals */
    amount: string;
    /** Checksummed EVM address */
    beneficiary: string;
  };
  meta: {
    /** Original order amount as decimal string */
    orderSize: string;
    rate: {
      /** Rate as decimal (e.g., "0.999") */
      decimal: string;
      /** Rate in parts-per-million (e.g., 999000) */
      ppm: number;
    };
    /** Fee amount as decimal string (currently "0.000000") */
    fee: string;
    /** Checksummed LP address */
    lpAddress: string;
    /** Unix expiry timestamp, optional */
    expiresAtS?: number;
  };
  state: {
    /** Amount received in USDT as decimal string */
    received: string;
    /** Amount sent in USDC as decimal string (0 if not closed) */
    sent: string;
  };
  txs: {
    create: Array<{
      txHash: string | null;
      chain: number;
      explorer: string;
    }>;
    close: Array<{
      txHash: string;
      chain: number;
      explorer: string;
    }> | null;
  };
}

export interface UntronInfoResponse {
  /// Liquidity in USDC units.
  availableLiquidity: number;
  /// Tron TRC-20 receiver addresses available. Can be empty.
  availableReceivers: string[];
  /// Unix time at which next one becomes available.
  retryAtS: number;
}

export async function untronInfo(): Promise<UntronInfoResponse> {
  const url = `${UNTRON_API_URL}/info`;
  console.log(`[UNTRON] fetching ${url}`);
  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get info: ${response.status} ${await awaitDebug(() => response.text())}`,
    );
  }

  return (await response.json()) as UntronInfoResponse;
}

export async function untronCreate({
  fromAmount,
  beneficiary,
}: {
  fromAmount: bigint;
  beneficiary: string;
}): Promise<UntronCreateOrderResponse> {
  assert(fromAmount < 2 ** 50, "Excessive amount");
  const url = `${UNTRON_API_URL}/create-order`;
  console.log(
    `[UNTRON] creating order ${url} amount=${fromAmount} beneficiary=${beneficiary}`,
  );

  const requestBody = {
    from: {
      chain: "tron",
      token: { symbol: "USDT" },
      amount: Number(fromAmount),
    },
    to: {
      chain: UNTRON_TO_CHAIN,
      token: { symbol: "USDC" },
      beneficiary,
    },
    rate: UNTRON_RATE,
  } as const;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    throw new Error(
      `failed to create order: ${response.status} ${await awaitDebug(() => response.text())}`,
    );
  }

  type NewCreateResp = {
    txHash: string;
    order: { receiver?: string } & Record<string, unknown>;
    expiresAt: number;
  };

  const newResp = (await response.json()) as NewCreateResp;

  // Determine ID string; prefer provided id if exists; otherwise compose and URI-encode
  const rawId = (newResp as any).id ?? (newResp.order as any)?.id ?? `${newResp.order.receiver}/${(newResp.order as any)?.orderNonce ?? (newResp.order as any)?.nonce ?? ""}`;
  const encodedId = encodeURIComponent(rawId);

  const legacyResp: UntronCreateOrderResponse = {
    id: encodedId,
    status: "open",
    receiver: newResp.order.receiver ?? "",
    receivedTotal: 0, // always zero at creation time
    expiresAtS: newResp.expiresAt,
  };

  return legacyResp;
}

export async function untronGet(orderId: string): Promise<UntronGetOrderResponse> {
  const url = `${UNTRON_API_URL}/order/${orderId}`;
  console.log(`[UNTRON] fetching ${url}`);
  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get order: ${response.status} ${await awaitDebug(() => response.text())}`,
    );
  }

  return (await response.json()) as UntronGetOrderResponse;
} 