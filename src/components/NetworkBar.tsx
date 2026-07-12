"use client";

import { useBlockNumber } from "wagmi";
import { arcTestnet } from "@/lib/arc";

export function NetworkBar() {
  const { data: block } = useBlockNumber({ chainId: arcTestnet.id, watch: true });

  return (
    <div className="border-b border-arc-border bg-arc-elevated text-xs text-arc-muted">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-1.5">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-arc-yes" />
          Arc Testnet
        </span>
        <span>Chain 5042002</span>
        <span>Gas USDC</span>
        <span className="ml-auto font-mono">Block {block ? Number(block).toLocaleString() : "—"}</span>
      </div>
    </div>
  );
}
