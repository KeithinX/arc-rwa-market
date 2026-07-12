import type { RWAAsset } from "./arc";

export function getAssetFromToken(token: string, assets: RWAAsset[]): RWAAsset | undefined {
  return assets.find((a) => a.tokenAddress.toLowerCase() === token.toLowerCase());
}
