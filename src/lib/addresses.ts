/**
 * 读取合约地址，优先级：
 * 1. 环境变量（NEXT_PUBLIC_*）
 * 2. localStorage（前端运行时用户保存的部署地址）
 * 3. 零地址兜底
 */
export function getStoredAddress(
  key: string,
  envValue?: string
): `0x${string}` {
  const fallback = "0x0000000000000000000000000000000000000000";
  if (envValue && envValue !== fallback) return envValue as `0x${string}`;
  if (typeof window === "undefined") return fallback as `0x${string}`;
  try {
    const stored = localStorage.getItem(key);
    return (stored && stored.startsWith("0x") && stored.length === 42
      ? stored
      : fallback) as `0x${string}`;
  } catch {
    return fallback as `0x${string}`;
  }
}

export function setStoredAddress(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function getMarketplaceAddress(): `0x${string}` {
  return getStoredAddress(
    "arc_marketplace",
    process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS
  );
}

export function getPredictionAddress(): `0x${string}` {
  return getStoredAddress(
    "arc_prediction",
    process.env.NEXT_PUBLIC_PREDICTION_ADDRESS
  );
}

export function isZeroAddress(addr: string): boolean {
  return addr === "0x0000000000000000000000000000000000000000";
}
