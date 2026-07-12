"use client";

import { useQuery } from "@tanstack/react-query";
import { useReadContract } from "wagmi";
import { formatUnits, createPublicClient, http } from "viem";
import { PREDICTION_ABI } from "@/lib/contracts";
import { getPredictionAddress, isZeroAddress } from "@/lib/addresses";
import { arcTestnet, ARC_RPC_URL } from "@/lib/arc";
import { type PredictionMarket, type MarketStatus, PREVIEW_MARKETS } from "@/lib/predictions";

const STATUS_MAP: MarketStatus[] = ["open", "resolved", "cancelled"];

function mapOnchainMarket(
  id: number,
  raw: readonly [string, string, string, bigint, bigint, bigint, number, number]
): PredictionMarket {
  const [question, assetSymbol, category, endTime, yesPool, noPool, status, outcome] = raw;
  return {
    id,
    question,
    assetSymbol,
    category: category as PredictionMarket["category"],
    endTime: Number(endTime) * 1000,
    yesPool: Number(formatUnits(yesPool, 6)),
    noPool: Number(formatUnits(noPool, 6)),
    status: STATUS_MAP[status] ?? "open",
    outcome: outcome === 1 ? "yes" : outcome === 2 ? "no" : undefined,
  };
}

export function usePredictions() {
  const predictionAddr = getPredictionAddress();
  const onChain = !isZeroAddress(predictionAddr);

  const { data: count } = useReadContract({
    address: predictionAddr,
    abi: PREDICTION_ABI,
    functionName: "marketCount",
    query: { enabled: onChain },
  });

  const marketCount = onChain ? Number(count ?? 0n) : 0;

  const { data: markets, isLoading } = useQuery({
    queryKey: ["predictions", predictionAddr, marketCount],
    enabled: onChain && marketCount > 0,
    queryFn: async () => {
      const client = createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) });
      const results: PredictionMarket[] = [];
      for (let i = 1; i <= marketCount; i++) {
        const raw = await client.readContract({
          address: predictionAddr,
          abi: PREDICTION_ABI,
          functionName: "markets",
          args: [BigInt(i)],
        });
        results.push(mapOnchainMarket(i, raw as Parameters<typeof mapOnchainMarket>[1]));
      }
      return results;
    },
    refetchInterval: 15_000,
  });

  // 合约未部署或链上无市场时，用预览市场保证功能按钮可见
  const list = onChain && markets && markets.length > 0 ? markets : PREVIEW_MARKETS;

  return {
    markets: list,
    isOnChain: onChain && !!markets && markets.length > 0,
    isPreview: !(onChain && markets && markets.length > 0),
    isLoading: onChain && isLoading,
    predictionAddr,
  };
}
