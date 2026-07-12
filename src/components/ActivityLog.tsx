"use client";

import { useContractEvents } from "@/hooks/useContractEvents";
import type { LocalTrade } from "@/hooks/useLocalStore";
import type { PredictionMarket } from "@/lib/predictions";
import clsx from "clsx";

export function ActivityLog({
  trades = [],
  markets = [],
}: {
  trades?: LocalTrade[];
  markets?: PredictionMarket[];
}) {
  const { events, isLoading } = useContractEvents();

  // 优先展示本地成交；链上事件作补充
  const localRows = trades.slice(0, 20).map((t) => {
    const m = markets.find((x) => x.id === t.marketId);
    return {
      id: `local-${t.id}`,
      time: ago(t.at),
      market: m?.assetSymbol,
      detail: `${t.side.toUpperCase()} $${t.amount} @ ${t.price}¢`,
      tone: t.side === "yes" ? "yes" : "no",
    };
  });

  const chainRows = events.map((e) => ({
    id: e.id,
    time: e.time,
    market: e.market,
    detail: e.detail,
    tone: "neutral" as const,
  }));

  const rows = localRows.length > 0 ? localRows : chainRows;

  return (
    <div className="border-t border-arc-border pt-5">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-arc-muted">Activity</p>

      {isLoading && rows.length === 0 && (
        <p className="text-sm text-arc-muted">Loading…</p>
      )}

      {!isLoading && rows.length === 0 && (
        <p className="text-sm text-arc-muted">No activity yet.</p>
      )}

      {rows.length > 0 && (
        <ul className="divide-y divide-arc-border/60">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-3 py-2.5">
              <div className="min-w-0">
                {row.market && (
                  <span className="mr-2 text-xs font-medium text-arc-muted">{row.market}</span>
                )}
                <p
                  className={clsx(
                    "truncate text-sm",
                    row.tone === "yes"
                      ? "text-arc-yes"
                      : row.tone === "no"
                        ? "text-arc-no"
                        : "text-arc-ink"
                  )}
                >
                  {row.detail}
                </p>
              </div>
              <span className="shrink-0 text-xs text-arc-muted">{row.time}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ago(at: number): string {
  const m = Math.max(1, Math.floor((Date.now() - at) / 60_000));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
