"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http, formatUnits } from "viem";
import { arcTestnet, ARC_RPC_URL } from "@/lib/arc";
import { getMarketplaceAddress, getPredictionAddress, isZeroAddress } from "@/lib/addresses";
import { MARKETPLACE_ABI, PREDICTION_ABI } from "@/lib/contracts";

export type ContractEvent = {
  id: string;
  time: string;
  type: "list" | "buy" | "cancel" | "predict" | "resolve" | "claim";
  market?: string;
  detail: string;
};

function formatAgo(ts: number): string {
  const diff = Date.now() - ts * 1000;
  if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function useContractEvents() {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const marketplace = getMarketplaceAddress();
  const prediction = getPredictionAddress();

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      if (isZeroAddress(marketplace) && isZeroAddress(prediction)) {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const client = createPublicClient({
          chain: arcTestnet,
          transport: http(ARC_RPC_URL, { timeout: 8_000 }),
        });

        // 带超时，避免 RPC 不可用时一直 Loading
        const withTimeout = <T,>(p: Promise<T>, ms = 10_000): Promise<T> =>
          Promise.race([
            p,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
          ]);

        const latest = await withTimeout(client.getBlockNumber());
        const fromBlock = latest > 20_000n ? latest - 20_000n : 0n;
        const logs: Array<ContractEvent & { blockNumber: bigint }> = [];

        if (!isZeroAddress(marketplace)) {
          const [listed, purchased, cancelledLogs] = await withTimeout(
            Promise.all([
              client.getContractEvents({
                address: marketplace,
                abi: MARKETPLACE_ABI,
                eventName: "Listed",
                fromBlock,
                toBlock: latest,
              }),
              client.getContractEvents({
                address: marketplace,
                abi: MARKETPLACE_ABI,
                eventName: "Purchased",
                fromBlock,
                toBlock: latest,
              }),
              client.getContractEvents({
                address: marketplace,
                abi: MARKETPLACE_ABI,
                eventName: "Cancelled",
                fromBlock,
                toBlock: latest,
              }),
            ])
          );

          for (const log of listed) {
            const args = log.args as {
              id?: bigint;
              rwaToken?: string;
              amount?: bigint;
            };
            logs.push({
              id: `${log.transactionHash}-${log.logIndex}`,
              blockNumber: log.blockNumber ?? 0n,
              time: "",
              type: "list",
              market: args.rwaToken ? `${args.rwaToken.slice(0, 6)}…` : undefined,
              detail: `Listed #${args.id?.toString() ?? "?"} · ${args.amount ? formatUnits(args.amount, 18) : "?"} shares`,
            });
          }

          for (const log of purchased) {
            const args = log.args as {
              id?: bigint;
              totalPaid?: bigint;
            };
            logs.push({
              id: `${log.transactionHash}-${log.logIndex}`,
              blockNumber: log.blockNumber ?? 0n,
              time: "",
              type: "buy",
              detail: `Bought listing #${args.id?.toString() ?? "?"} · ${args.totalPaid ? formatUnits(args.totalPaid, 6) : "?"} USDC`,
            });
          }

          for (const log of cancelledLogs) {
            const args = log.args as { id?: bigint };
            logs.push({
              id: `${log.transactionHash}-${log.logIndex}`,
              blockNumber: log.blockNumber ?? 0n,
              time: "",
              type: "cancel",
              detail: `Cancelled listing #${args.id?.toString() ?? "?"}`,
            });
          }
        }

        if (!isZeroAddress(prediction)) {
          const [created, positions, resolved, claimed] = await withTimeout(
            Promise.all([
              client.getContractEvents({
                address: prediction,
                abi: PREDICTION_ABI,
                eventName: "MarketCreated",
                fromBlock,
                toBlock: latest,
              }),
              client.getContractEvents({
                address: prediction,
                abi: PREDICTION_ABI,
                eventName: "PositionTaken",
                fromBlock,
                toBlock: latest,
              }),
              client.getContractEvents({
                address: prediction,
                abi: PREDICTION_ABI,
                eventName: "MarketResolved",
                fromBlock,
                toBlock: latest,
              }),
              client.getContractEvents({
                address: prediction,
                abi: PREDICTION_ABI,
                eventName: "Claimed",
                fromBlock,
                toBlock: latest,
              }),
            ])
          );

          for (const log of created) {
            const args = log.args as { id?: bigint; assetSymbol?: string };
            logs.push({
              id: `${log.transactionHash}-${log.logIndex}`,
              blockNumber: log.blockNumber ?? 0n,
              time: "",
              type: "predict",
              market: args.assetSymbol,
              detail: `Market #${args.id?.toString() ?? "?"} created`,
            });
          }

          for (const log of positions) {
            const args = log.args as {
              id?: bigint;
              isYes?: boolean;
              amount?: bigint;
            };
            logs.push({
              id: `${log.transactionHash}-${log.logIndex}`,
              blockNumber: log.blockNumber ?? 0n,
              time: "",
              type: "predict",
              detail: `${args.isYes ? "YES" : "NO"} · ${args.amount ? formatUnits(args.amount, 6) : "?"} USDC on #${args.id?.toString() ?? "?"}`,
            });
          }

          for (const log of resolved) {
            const args = log.args as { id?: bigint; outcome?: number };
            logs.push({
              id: `${log.transactionHash}-${log.logIndex}`,
              blockNumber: log.blockNumber ?? 0n,
              time: "",
              type: "resolve",
              detail: `Market #${args.id?.toString() ?? "?"} resolved ${args.outcome === 1 ? "YES" : args.outcome === 2 ? "NO" : "?"}`,
            });
          }

          for (const log of claimed) {
            const args = log.args as { id?: bigint; payout?: bigint };
            logs.push({
              id: `${log.transactionHash}-${log.logIndex}`,
              blockNumber: log.blockNumber ?? 0n,
              time: "",
              type: "claim",
              detail: `Claimed ${args.payout ? formatUnits(args.payout, 6) : "?"} USDC from #${args.id?.toString() ?? "?"}`,
            });
          }
        }

        const uniqueBlocks = [...new Set(logs.map((l) => l.blockNumber))].slice(0, 30);
        const timestamps = new Map<bigint, number>();
        await Promise.all(
          uniqueBlocks.map(async (bn) => {
            if (bn === 0n) return;
            try {
              const block = await withTimeout(client.getBlock({ blockNumber: bn }), 5_000);
              timestamps.set(bn, Number(block.timestamp));
            } catch {
              /* ignore */
            }
          })
        );

        const enriched = logs
          .map((l) => ({
            id: l.id,
            type: l.type,
            market: l.market,
            detail: l.detail,
            time: timestamps.has(l.blockNumber) ? formatAgo(timestamps.get(l.blockNumber)!) : "—",
            _bn: l.blockNumber,
          }))
          .sort((a, b) => (a._bn < b._bn ? 1 : -1))
          .slice(0, 40)
          .map(({ _bn, ...rest }) => rest);

        if (!cancelled) setEvents(enriched);
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchEvents();
    const id = setInterval(fetchEvents, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [marketplace, prediction]);

  return { events, isLoading };
}
