"use client";

import { useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { ensureArcNetwork, isArcNetwork } from "@/lib/wallet";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const connector = connectors.find((c) => c.id === "metaMask") || connectors.find((c) => c.id === "injected") || connectors[0];

  useEffect(() => {
    if (isConnected && !isArcNetwork(chainId)) {
      ensureArcNetwork().catch(() => {});
    }
  }, [isConnected, chainId]);

  if (isConnected && address) {
    const wrong = !isArcNetwork(chainId);
    return (
      <div className="flex items-center gap-2">
        {wrong && (
          <button onClick={() => ensureArcNetwork().catch(() => {})} className="btn-ghost text-arc-no">
            Switch network
          </button>
        )}
        <span className="hidden font-mono text-sm text-arc-muted lg:inline">{address.slice(0, 6)}…{address.slice(-4)}</span>
        <button onClick={() => disconnect()} className="btn-secondary text-sm">Disconnect</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={() => { ensureArcNetwork().catch(() => {}); connector && connect({ connector }); }}
        disabled={isPending || !connector}
        className="btn-primary text-sm"
      >
        {isPending ? "Connecting…" : "Connect wallet"}
      </button>
      {error && <p className="mt-1 max-w-[180px] text-right text-xs text-arc-no">{error.message}</p>}
    </div>
  );
}
