import { arcTestnet } from "@/lib/arc";

export async function ensureArcNetwork(): Promise<void> {
  if (typeof window === "undefined" || !window.ethereum) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + arcTestnet.id.toString(16) }],
    });
  } catch (switchError: any) {
    if (switchError?.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x" + arcTestnet.id.toString(16),
              chainName: arcTestnet.name,
              nativeCurrency: arcTestnet.nativeCurrency,
              rpcUrls: ["https://rpc.testnet.arc.network"],
              blockExplorerUrls: ["https://testnet.arcscan.app"],
            },
          ],
        });
      } catch {}
    }
  }
}

export function isArcNetwork(chainId?: number): boolean {
  return chainId === arcTestnet.id;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
