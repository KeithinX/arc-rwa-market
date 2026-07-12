"use client";

import { useState } from "react";
import type { RWAAsset } from "@/lib/arc";
import { AssetDetailsModal } from "./AssetDetailsModal";
import clsx from "clsx";

export function AssetCard({ asset, onTrade }: { asset: RWAAsset; onTrade: (a: RWAAsset) => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const up = asset.change24h >= 0;

  return (
    <>
      <div className="flex flex-col rounded-xl border border-arc-border bg-white p-4 hover:border-arc-ink/20">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-arc-ink">{asset.symbol}</p>
            <p className="mt-0.5 text-xs text-arc-muted">{asset.name}</p>
          </div>
          <span className="text-xs text-arc-muted">{asset.risk}</span>
        </div>

        <p className="font-mono text-2xl font-semibold tracking-tight text-arc-ink">${asset.details.nav}</p>
        <p className="mt-1 text-xs text-arc-muted">NAV</p>

        <div className="mt-4 mb-4 grid grid-cols-3 gap-2 border-t border-arc-border pt-3 text-xs">
          <div>
            <p className="text-arc-muted">24h</p>
            <p className={clsx("mt-0.5 font-medium", up ? "text-arc-yes" : "text-arc-no")}>
              {up ? "+" : "−"}{Math.abs(asset.change24h).toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-arc-muted">APY</p>
            <p className="mt-0.5 font-medium text-arc-ink">{asset.apy}%</p>
          </div>
          <div>
            <p className="text-arc-muted">AUM</p>
            <p className="mt-0.5 font-medium text-arc-ink">${(asset.value / 1_000_000).toFixed(1)}M</p>
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          <button type="button" onClick={() => onTrade(asset)} className="btn-primary flex-1 text-sm">
            Trade
          </button>
          <button type="button" onClick={() => setShowDetails(true)} className="btn-outline px-3 text-sm">
            Details
          </button>
        </div>
      </div>

      {showDetails && <AssetDetailsModal asset={asset} onClose={() => setShowDetails(false)} onTrade={onTrade} />}
    </>
  );
}
