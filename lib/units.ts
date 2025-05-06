export const DEFAULT_DECIMALS = 6;

// Convert a decimal string (e.g. "12.34") to bigint of smallest units (e.g. with 6 decimals -> 12340000n)
export function stringToUnits(value: string, decimals: number = DEFAULT_DECIMALS): bigint {
  if (!value) return 0n;

  // Handle negative values
  const negative = value.startsWith('-');
  const sanitized = negative ? value.slice(1) : value;

  const [intPart, fracPart = ""] = sanitized.split(".");
  const paddedFrac = fracPart.padEnd(decimals, "0").slice(0, decimals);
  const combined = `${intPart}${paddedFrac}`.replace(/^0+/, ""); // remove leading zeros

  const units = BigInt(combined === "" ? "0" : combined);
  return negative ? -units : units;
}

// Convert bigint of smallest units back to a decimal string (trim trailing zeros) for display
export function unitsToString(units: bigint, decimals: number = DEFAULT_DECIMALS): string {
  const negative = units < 0n;
  const absUnits = negative ? -units : units;

  const str = absUnits.toString().padStart(decimals + 1, "0");
  const intPart = str.slice(0, -decimals);
  const fracPartRaw = str.slice(-decimals);
  const fracPart = fracPartRaw.replace(/0+$/, ""); // trim trailing zeros

  const result = fracPart ? `${intPart}.${fracPart}` : intPart;
  return negative ? `-${result}` : result;
}

export const SCALING_FACTOR: bigint = 10n ** BigInt(DEFAULT_DECIMALS);

// Factor used for swap rate scaling (assumes swapRateUnits has 6 decimals)
export const RATE_SCALE: bigint = 10n ** 6n;

// Convert sendUnits (smallest units) to receiveUnits using swapRateUnits (also smallest units).
export function convertSendToReceive(sendUnits: bigint, swapRateUnits: bigint): bigint {
  // (sendUnits * swapRateUnits) / RATE_SCALE with rounding to nearest
  return (sendUnits * swapRateUnits + RATE_SCALE / 2n) / RATE_SCALE;
}

// Convert receiveUnits back to sendUnits using swapRateUnits.
export function convertReceiveToSend(receiveUnits: bigint, swapRateUnits: bigint): bigint {
  // (receiveUnits * RATE_SCALE) / swapRateUnits with rounding to nearest
  return (receiveUnits * RATE_SCALE + swapRateUnits / 2n) / swapRateUnits;
}
