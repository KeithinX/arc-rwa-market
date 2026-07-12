"use client";

import {
  type PredictionMarket,
  calcYesPct,
  formatTimeLeft,
  formatUsdc,
} from "@/lib/predictions";
import clsx from "clsx";

export function MarketCard({
  market,
  watched,
  onToggleWatch,
  onOpen,
  onPredict,
}: {
  market: PredictionMarket;
  watched?: boolean;
  onToggleWatch?: () => void;
  onOpen?: () => void;
  onPredict: (market: PredictionMarket, side: "yes" | "no") => void;
}) {
  const yesPct = calcYesPct(market);
  const noPct = 100 - yesPct;
  const total = market.yesPool + market.noPool;
  const isOpen = market.status === "open" && Date.now() < market.endTime;

  return (
    <div className="flex flex-col rounded-xl border border-arc-border bg-white p-4 hover:border-arc-ink/20">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-arc-muted">
        <button type="button" onClick={onOpen} className="hover:text-arc-ink">
          {market.assetSymbol}
        </button>
        <div className="flex items-center gap-2">
          <span>
            {market.status === "resolved"
              ? "Resolved"
              : isOpen
                ? formatTimeLeft(market.endTime)
                : "Closed"}
          </span>
          {onToggleWatch && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatch();
              }}
              className={clsx(
                "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                watched ? "text-arc-ink" : "text-arc-dim hover:text-arc-ink"
              )}
              aria-label={watched ? "Unwatch" : "Watch"}
            >
              {watched ? "Watching" : "Watch"}
            </button>
          )}
        </div>
      </div>

      <button type="button" onClick={onOpen} className="mb-4 flex-1 text-left">
        <h3 className="text-base font-medium leading-snug text-arc-ink hover:underline">
          {market.question}
        </h3>
      </button>

      <div className="mb-3">
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="font-medium text-arc-yes">{yesPct}% Yes</span>
          <span className="font-medium text-arc-no">{noPct}% No</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-arc-elevated">
          <div className="bg-arc-yes" style={{ width: `${yesPct}%` }} />
          <div className="bg-arc-no" style={{ width: `${noPct}%` }} />
        </div>
      </div>

      <p className="mb-3 text-sm text-arc-muted">{formatUsdc(total)} volume</p>

      <div className="mt-auto flex gap-2">
        {isOpen ? (
          <>
            <button
              type="button"
              onClick={() => onPredict(market, "yes")}
              className="flex-1 rounded-lg bg-[#ecfdf5] py-2.5 text-base font-semibold text-arc-yes hover:bg-[#d1fae5]"
            >
              Yes {yesPct}¢
            </button>
            <button
              type="button"
              onClick={() => onPredict(market, "no")}
              className="flex-1 rounded-lg bg-[#fef2f2] py-2.5 text-base font-semibold text-arc-no hover:bg-[#fee2e2]"
            >
              No {noPct}¢
            </button>
          </>
        ) : market.status === "resolved" ? (
          <button
            type="button"
            onClick={() => onPredict(market, market.outcome === "yes" ? "yes" : "no")}
            className="btn-primary w-full text-sm"
          >
            Claim
          </button>
        ) : (
          <div className="w-full rounded-lg border border-arc-border py-2 text-center text-xs text-arc-muted">
            Closed
          </div>
        )}
      </div>
    </div>
  );
}

export function ProbabilityBar({ yesPct }: { yesPct: number }) {
  const noPct = 100 - yesPct;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-arc-yes">{yesPct}% Yes</span>
        <span className="font-medium text-arc-no">{noPct}% No</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-arc-elevated">
        <div className="bg-arc-yes" style={{ width: `${yesPct}%` }} />
        <div className="bg-arc-no" style={{ width: `${noPct}%` }} />
      </div>
    </div>
  );
}
