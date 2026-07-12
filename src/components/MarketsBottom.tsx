"use client";

import { calcYesPct, formatUsdc, type PredictionMarket } from "@/lib/predictions";
import type { LocalTrade } from "@/hooks/useLocalStore";
import clsx from "clsx";

export function MarketsBottom({
  markets,
  trades,
  onOpen,
}: {
  markets: PredictionMarket[];
  trades: LocalTrade[];
  onOpen: (m: PredictionMarket) => void;
}) {
  const totalVol = markets.reduce((s, m) => s + m.yesPool + m.noPool, 0);
  const byVolume = [...markets]
    .sort((a, b) => b.yesPool + b.noPool - (a.yesPool + a.noPool))
    .slice(0, 6);
  const ending = [...markets]
    .filter((m) => m.status === "open")
    .sort((a, b) => a.endTime - b.endTime)
    .slice(0, 5);

  return (
    <div className="mt-8 border-t border-arc-border pt-5">
      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-arc-muted">
        <span>
          <span className="font-medium text-arc-ink">{markets.length}</span> markets
        </span>
        <span className="text-arc-border">·</span>
        <span>
          <span className="font-medium text-arc-ink">{formatUsdc(totalVol)}</span> vol
        </span>
        {trades.length > 0 && (
          <>
            <span className="text-arc-border">·</span>
            <span>
              <span className="font-medium text-arc-ink">{trades.length}</span> fills
            </span>
          </>
        )}
      </div>

      {/* 有成交时先展示真实 fills，避免空白占位 */}
      {trades.length > 0 && (
        <section className="mb-8">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-arc-muted">
            Your fills
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-arc-border text-left text-[11px] text-arc-muted">
                  <th className="pb-2 pr-3 font-medium">Market</th>
                  <th className="pb-2 pr-3 font-medium">Side</th>
                  <th className="pb-2 pr-3 text-right font-medium">Size</th>
                  <th className="pb-2 pr-3 text-right font-medium">Price</th>
                  <th className="pb-2 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 12).map((t) => {
                  const m = markets.find((x) => x.id === t.marketId);
                  return (
                    <tr
                      key={t.id}
                      className="cursor-pointer border-b border-arc-border/50 last:border-0 hover:bg-arc-elevated/50"
                      onClick={() => m && onOpen(m)}
                    >
                      <td className="max-w-[240px] truncate py-2.5 pr-3 text-arc-ink">
                        {m?.assetSymbol ?? `#${t.marketId}`}
                      </td>
                      <td
                        className={clsx(
                          "py-2.5 pr-3 font-medium uppercase",
                          t.side === "yes" ? "text-arc-yes" : "text-arc-no"
                        )}
                      >
                        {t.side}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono">${t.amount}</td>
                      <td className="py-2.5 pr-3 text-right font-mono">{t.price}¢</td>
                      <td className="py-2.5 text-right text-arc-muted">{ago(t.at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
        <section>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-arc-muted">
            By volume
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-arc-border text-left text-[11px] text-arc-muted">
                  <th className="pb-2 pr-3 font-medium">Market</th>
                  <th className="pb-2 pr-3 text-right font-medium">Yes</th>
                  <th className="pb-2 pr-3 text-right font-medium">Vol</th>
                  <th className="pb-2 text-right font-medium">Ends</th>
                </tr>
              </thead>
              <tbody>
                {byVolume.map((m) => {
                  const vol = m.yesPool + m.noPool;
                  const days = Math.max(0, Math.ceil((m.endTime - Date.now()) / 86_400_000));
                  const yes = calcYesPct(m);
                  return (
                    <tr
                      key={m.id}
                      className="cursor-pointer border-b border-arc-border/50 last:border-0 hover:bg-arc-elevated/50"
                      onClick={() => onOpen(m)}
                    >
                      <td className="max-w-[320px] py-2.5 pr-3">
                        <span className="font-medium text-arc-ink">{m.assetSymbol}</span>
                        <span className="ml-2 text-arc-muted">
                          {m.question.length > 48 ? `${m.question.slice(0, 48)}…` : m.question}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono text-arc-yes">{yes}¢</td>
                      <td className="py-2.5 pr-3 text-right font-mono text-arc-ink">
                        {formatUsdc(vol)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-arc-muted">{days}d</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-arc-muted">
            Expiring
          </p>
          <ul className="divide-y divide-arc-border/60">
            {ending.map((m) => {
              const days = Math.max(0, Math.ceil((m.endTime - Date.now()) / 86_400_000));
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(m)}
                    className="flex w-full items-baseline justify-between gap-3 py-2.5 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-arc-ink hover:underline">
                        {m.assetSymbol}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-arc-muted">
                        {m.question}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-arc-muted">
                      {days}d · {calcYesPct(m)}¢
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
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
