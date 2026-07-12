"use client";

import { calcYesPct, formatTimeLeft, formatUsdc, type PredictionMarket } from "@/lib/predictions";
import clsx from "clsx";

export function MarketDetail({
  market,
  watched,
  onToggleWatch,
  onPredict,
  onClose,
  recentTrades,
}: {
  market: PredictionMarket;
  watched: boolean;
  onToggleWatch: () => void;
  onPredict: (side: "yes" | "no") => void;
  onClose: () => void;
  recentTrades: { side: "yes" | "no"; amount: number; price: number; at: number }[];
}) {
  const yesPct = calcYesPct(market);
  const noPct = 100 - yesPct;
  const total = market.yesPool + market.noPool;
  const isOpen = market.status === "open" && Date.now() < market.endTime;

  // 用池子比例拆档，标注为 Pool 而非虚假 order book
  const depth = [0.4, 0.28, 0.18, 0.14].map((w, i) => ({
    yes: Math.round(market.yesPool * w),
    no: Math.round(market.noPool * w),
    priceYes: Math.max(1, yesPct - i * 4),
    priceNo: Math.max(1, noPct - i * 4),
  }));

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="modal-enter flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-arc-border bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-arc-border bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-arc-muted">
              <span>{market.assetSymbol}</span>
              <span>·</span>
              <span>{market.category}</span>
              <span>·</span>
              <span>{isOpen ? formatTimeLeft(market.endTime) : "Closed"}</span>
            </div>
            <h2 className="mt-1 text-lg font-semibold leading-snug text-arc-ink">{market.question}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onToggleWatch}
              className={clsx(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium",
                watched ? "bg-arc-ink text-white" : "bg-arc-elevated text-arc-muted hover:text-arc-ink"
              )}
            >
              {watched ? "Watching" : "Watch"}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost h-8 w-8 p-0">
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-6 p-5">
          <div>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-arc-muted">Yes</p>
                <p className="font-mono text-3xl font-semibold text-arc-yes">{yesPct}¢</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-arc-muted">Volume</p>
                <p className="font-mono text-lg font-semibold text-arc-ink">{formatUsdc(total)}</p>
              </div>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-arc-elevated">
              <div className="bg-arc-yes" style={{ width: `${yesPct}%` }} />
              <div className="bg-arc-no" style={{ width: `${noPct}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-arc-muted">
              <span>Yes {yesPct}%</span>
              <span>No {noPct}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!isOpen}
              onClick={() => onPredict("yes")}
              className="rounded-lg bg-[#ecfdf5] py-3.5 text-base font-semibold text-arc-yes hover:bg-[#d1fae5] disabled:opacity-40"
            >
              Buy Yes · {yesPct}¢
            </button>
            <button
              type="button"
              disabled={!isOpen}
              onClick={() => onPredict("no")}
              className="rounded-lg bg-[#fef2f2] py-3.5 text-base font-semibold text-arc-no hover:bg-[#fee2e2] disabled:opacity-40"
            >
              Buy No · {noPct}¢
            </button>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-arc-muted">Pool</p>
            <div className="overflow-hidden border border-arc-border">
              <div className="grid grid-cols-4 gap-2 border-b border-arc-border bg-arc-elevated/60 px-3 py-2 text-[11px] font-medium text-arc-muted">
                <span>Yes ¢</span>
                <span className="text-right">Size</span>
                <span>No ¢</span>
                <span className="text-right">Size</span>
              </div>
              {depth.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 gap-2 border-b border-arc-border/60 px-3 py-2 font-mono text-xs last:border-0"
                >
                  <span className="text-arc-yes">{row.priceYes}</span>
                  <span className="text-right text-arc-ink">{formatUsdc(row.yes)}</span>
                  <span className="text-arc-no">{row.priceNo}</span>
                  <span className="text-right text-arc-ink">{formatUsdc(row.no)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-arc-muted">
              Recent fills
            </p>
            {recentTrades.length === 0 ? (
              <p className="text-sm text-arc-muted">No fills on this market yet.</p>
            ) : (
              <ul className="divide-y divide-arc-border/60">
                {recentTrades.slice(0, 8).map((t, i) => (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className={t.side === "yes" ? "text-arc-yes" : "text-arc-no"}>
                      {t.side.toUpperCase()} · ${t.amount}
                    </span>
                    <span className="font-mono text-xs text-arc-muted">
                      {t.price}¢ · {Math.max(1, Math.floor((Date.now() - t.at) / 60_000))}m
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
