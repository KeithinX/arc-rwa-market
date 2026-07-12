import { defineChain } from "viem";

export const ARC_RPC_URL = "https://rpc.testnet.arc.network";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [ARC_RPC_URL] },
    public: { http: [ARC_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;

export const MARKETPLACE_ADDRESS =
  (process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const PREDICTION_ADDRESS =
  (process.env.NEXT_PUBLIC_PREDICTION_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`;

export interface RWAAsset {
  id: string;
  name: string;
  symbol: string;
  type: string;
  value: number;
  apy: number;
  risk: string;
  tokenAddress: `0x${string}`;
  description: string;
  image: string;
  spark: number[];
  change24h: number;
  details: {
    custodian: string;
    auditor: string;
    nav: string;
    navUnit: string;
    lastValuation: string;
    distribution: string;
    domicile: string;
    legalStructure: string;
    underlying: string;
    compliance: string;
    iso: string;
  };
}
