"use client";

import type { Position } from "@/hooks/useLocalStore";
import { calcYesPct, type PredictionMarket } from "@/lib/predictions";
import clsx from "clsx";

export function PositionsPanel({
  positions,
  markets,
  onClose,
  onTradeMore,
}: {
  positions: Position[];
  markets: PredictionMarket[];
  onClose: (id: string) => void;
  onTradeMore: (marketId: number, side: "yes" | "no") => void;
}) {
  if (positions.length === 0) {
    return (
      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-arc-muted">
          Positions
        </p>
        <p className="text-sm text-arc-muted">No open positions.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-arc-muted">
        Positions · {positions.length}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-arc-border text-left text-[11px] text-arc-muted">
              <th className="pb-2 pr-3 font-medium">Market</th>
              <th className="pb-2 pr-3 font-medium">Side</th>
              <th className="pb-2 pr-3 text-right font-medium">Size</th>
              <th className="pb-2 pr-3 text-right font-medium">Entry</th>
              <th className="pb-2 pr-3 text-right font-medium">Mark</th>
              <th className="pb-2 pr-3 text-right font-medium">PnL</th>
              <th className="pb-2 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => {
              const market = markets.find((m) => m.id === p.marketId);
              const live = market ? calcYesPct(market) : p.entryPrice;
              const mark = p.side === "yes" ? live : 100 - live;
              const pnlPct = ((mark - p.entryPrice) / p.entryPrice) * 100;
              const pnlUsd = (p.amount * pnlPct) / 100;

              return (
                <tr key={p.id} className="border-b border-arc-border/50 last:border-0">
                  <td className="max-w-[180px] truncate py-2.5 pr-3 text-arc-ink">
                    {p.assetSymbol}
                  </td>
                  <td
                    className={clsx(
                      "py-2.5 pr-3 font-medium uppercase",
                      p.side === "yes" ? "text-arc-yes" : "text-arc-no"
                    )}
                  >
                    {p.side}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono">${p.amount}</td>
                  <td className="py-2.5 pr-3 text-right font-mono text-arc-muted">{p.entryPrice}¢</td>
                  <td className="py-2.5 pr-3 text-right font-mono">{mark}¢</td>
                  <td
                    className={clsx(
                      "py-2.5 pr-3 text-right font-mono font-medium",
                      pnlUsd >= 0 ? "text-arc-yes" : "text-arc-no"
                    )}
                  >
                    {pnlUsd >= 0 ? "+" : ""}
                    ${pnlUsd.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onTradeMore(p.marketId, p.side)}
                      className="mr-2 text-xs font-medium text-arc-ink hover:underline"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => onClose(p.id)}
                      className="text-xs font-medium text-arc-muted hover:text-arc-no"
                    >
                      Close
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
