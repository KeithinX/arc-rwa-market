"use client";

import { useMemo, useState } from "react";
import type { RWAAsset } from "@/lib/arc";
import { formatUsdc } from "@/lib/predictions";
import clsx from "clsx";

type PreviewListing = {
  id: number;
  symbol: string;
  side: "sell" | "buy";
  amount: number;
  price: number;
};

function buildListings(assets: RWAAsset[]): PreviewListing[] {
  const out: PreviewListing[] = [];
  let id = 1;
  for (const a of assets) {
    const nav = Number(a.details.nav);
    out.push(
      { id: id++, symbol: a.symbol, side: "sell", amount: 1200, price: nav * 1.01 },
      { id: id++, symbol: a.symbol, side: "sell", amount: 800, price: nav * 1.03 },
      { id: id++, symbol: a.symbol, side: "buy", amount: 500, price: nav * 0.98 }
    );
  }
  return out;
}

export function OrderBook({
  assets,
  onTrade,
}: {
  assets: RWAAsset[];
  onTrade: (asset: RWAAsset) => void;
}) {
  const [symbol, setSymbol] = useState<string>("All");
  const listings = useMemo(() => buildListings(assets), [assets]);
  const filtered = symbol === "All" ? listings : listings.filter((l) => l.symbol === symbol);

  return (
    <div className="mt-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium text-arc-muted">Order book</p>
        <div className="flex flex-wrap gap-1">
          {["All", ...assets.map((a) => a.symbol)].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSymbol(s)}
              className={clsx(
                "rounded-md px-2 py-1 text-xs font-medium",
                symbol === s ? "bg-arc-ink text-white" : "text-arc-muted hover:bg-arc-elevated"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-arc-border text-left text-[11px] text-arc-muted">
              <th className="pb-2 pr-3 font-medium">Asset</th>
              <th className="pb-2 pr-3 font-medium">Side</th>
              <th className="pb-2 pr-3 text-right font-medium">Size</th>
              <th className="pb-2 pr-3 text-right font-medium">Price</th>
              <th className="pb-2 pr-3 text-right font-medium">Total</th>
              <th className="pb-2 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const asset = assets.find((a) => a.symbol === l.symbol)!;
              return (
                <tr key={l.id} className="border-b border-arc-border/50 last:border-0 hover:bg-arc-elevated/40">
                  <td className="py-2.5 pr-3 font-medium text-arc-ink">{l.symbol}</td>
                  <td className={clsx("py-2.5 pr-3 capitalize", l.side === "sell" ? "text-arc-no" : "text-arc-yes")}>
                    {l.side}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono">{l.amount.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 text-right font-mono">${l.price.toFixed(2)}</td>
                  <td className="py-2.5 pr-3 text-right font-mono text-arc-muted">
                    {formatUsdc(l.amount * l.price)}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onTrade(asset)}
                      className="text-xs font-medium text-arc-ink hover:underline"
                    >
                      Trade
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
