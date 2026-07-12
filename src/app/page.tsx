"use client";

import { useMemo, useState } from "react";
import { type RWAAsset } from "@/lib/arc";
import { type PredictionMarket, type MarketCategory, calcYesPct } from "@/lib/predictions";
import { useAssets } from "@/hooks/useAssets";
import { usePredictions } from "@/hooks/usePredictions";
import { MarketCard } from "@/components/MarketCard";
import { MarketDetail } from "@/components/MarketDetail";
import { PredictModal } from "@/components/PredictModal";
import { AssetCard } from "@/components/AssetCard";
import { TradeModal } from "@/components/TradeModal";
import { Portfolio } from "@/components/Portfolio";
import { ActivityLog } from "@/components/ActivityLog";
import { OrderBook } from "@/components/OrderBook";
import { PositionsPanel } from "@/components/PositionsPanel";
import { MarketsBottom } from "@/components/MarketsBottom";
import { useContractAddresses } from "@/hooks/useContractAddresses";
import { useAppTab } from "@/components/AppNav";
import {
  useLocalStore,
  type LocalTrade,
  type Position,
} from "@/hooks/useLocalStore";
import clsx from "clsx";

const CATEGORIES: (MarketCategory | "All")[] = ["All", "NAV", "APY", "Price", "Volume"];
type SortKey = "volume" | "ending" | "yes";

export default function HomePage() {
  const [selectedAsset, setSelectedAsset] = useState<RWAAsset | null>(null);
  const [predictTarget, setPredictTarget] = useState<{ market: PredictionMarket; side: "yes" | "no" } | null>(null);
  const [detailMarket, setDetailMarket] = useState<PredictionMarket | null>(null);
  const [filter, setFilter] = useState<MarketCategory | "All">("All");
  const [sort, setSort] = useState<SortKey>("volume");
  const [query, setQuery] = useState("");
  const [watchOnly, setWatchOnly] = useState(false);
  const [activeTab] = useAppTab();

  const assets = useAssets();
  const { markets, isLoading: marketsLoading, isPreview } = usePredictions();
  const { isPredictionDeployed } = useContractAddresses();

  const [watchlist, setWatchlist] = useLocalStore<number[]>("arc_watchlist", []);
  const [positions, setPositions] = useLocalStore<Position[]>("arc_positions", []);
  const [trades, setTrades] = useLocalStore<LocalTrade[]>("arc_trades", []);

  const filtered = useMemo(() => {
    let list = filter === "All" ? markets : markets.filter((m) => m.category === filter);
    if (watchOnly) list = list.filter((m) => watchlist.includes(m.id));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.question.toLowerCase().includes(q) ||
          m.assetSymbol.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "ending") return a.endTime - b.endTime;
      if (sort === "yes") return calcYesPct(b) - calcYesPct(a);
      return b.yesPool + b.noPool - (a.yesPool + a.noPool);
    });
  }, [markets, filter, watchOnly, watchlist, query, sort]);

  function toggleWatch(id: number) {
    setWatchlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function recordFill(market: PredictionMarket, amount: number, price: number, side: "yes" | "no") {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setPositions((prev) => [
      {
        id,
        marketId: market.id,
        question: market.question,
        assetSymbol: market.assetSymbol,
        side,
        amount,
        entryPrice: price,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setTrades((prev) => [
      { id, marketId: market.id, side, amount, price, at: Date.now() },
      ...prev,
    ].slice(0, 50));
  }

  const detailTrades = detailMarket
    ? trades
        .filter((t) => t.marketId === detailMarket.id)
        .map((t) => ({ side: t.side, amount: t.amount, price: t.price, at: t.at }))
    : [];

  return (
    <div className="space-y-6">
      {activeTab === "markets" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-arc-ink">Markets</h1>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="input h-9 w-40 text-sm"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="input h-9 w-auto text-sm"
              >
                <option value="volume">Volume</option>
                <option value="ending">Ending</option>
                <option value="yes">Yes ¢</option>
              </select>
              <button
                type="button"
                onClick={() => setWatchOnly((v) => !v)}
                className={clsx(
                  "h-9 rounded-lg px-3 text-xs font-semibold",
                  watchOnly ? "bg-arc-ink text-white" : "border border-arc-border text-arc-muted hover:text-arc-ink"
                )}
              >
                Watchlist{watchlist.length > 0 ? ` ${watchlist.length}` : ""}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={clsx(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === c
                    ? "bg-arc-ink text-white"
                    : "text-arc-muted hover:bg-arc-elevated hover:text-arc-ink"
                )}
              >
                {c === "All" ? "All" : c}
              </button>
            ))}
          </div>

          {marketsLoading && markets.length === 0 && (
            <p className="py-16 text-center text-sm text-arc-muted">Loading…</p>
          )}

          {filtered.length === 0 && !marketsLoading && (
            <p className="py-16 text-center text-sm text-arc-muted">No markets match your filters.</p>
          )}

          {filtered.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m) => (
                <MarketCard
                  key={m.id}
                  market={m}
                  watched={watchlist.includes(m.id)}
                  onToggleWatch={() => toggleWatch(m.id)}
                  onOpen={() => setDetailMarket(m)}
                  onPredict={(mk, side) => setPredictTarget({ market: mk, side })}
                />
              ))}
            </div>
          )}

          {markets.length > 0 && (
            <MarketsBottom
              markets={markets}
              trades={trades}
              onOpen={setDetailMarket}
            />
          )}
        </div>
      )}

      {activeTab === "assets" && (
        <div className="space-y-5">
          <h1 className="text-2xl font-semibold tracking-tight text-arc-ink">Assets</h1>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} onTrade={setSelectedAsset} />
            ))}
          </section>
          <OrderBook assets={assets} onTrade={setSelectedAsset} />
        </div>
      )}

      {activeTab === "portfolio" && (
        <div className="space-y-5">
          <h1 className="text-2xl font-semibold tracking-tight text-arc-ink">Portfolio</h1>
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <PositionsPanel
                positions={positions}
                markets={markets}
                onClose={(id) => setPositions((prev) => prev.filter((p) => p.id !== id))}
                onTradeMore={(marketId, side) => {
                  const market = markets.find((m) => m.id === marketId);
                  if (market) setPredictTarget({ market, side });
                }}
              />
              <ActivityLog trades={trades} markets={markets} />
            </div>
            <div>
              <Portfolio compact />
            </div>
          </section>
        </div>
      )}

      {selectedAsset && <TradeModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />}

      {detailMarket && (
        <MarketDetail
          market={detailMarket}
          watched={watchlist.includes(detailMarket.id)}
          onToggleWatch={() => toggleWatch(detailMarket.id)}
          onPredict={(side) => {
            setPredictTarget({ market: detailMarket, side });
          }}
          onClose={() => setDetailMarket(null)}
          recentTrades={detailTrades}
        />
      )}

      {predictTarget && (
        <PredictModal
          market={predictTarget.market}
          side={predictTarget.side}
          onClose={() => setPredictTarget(null)}
          preview={!isPredictionDeployed || isPreview}
          onFilled={({ amount, price, side }) => {
            recordFill(predictTarget.market, amount, price, side);
          }}
        />
      )}
    </div>
  );
}
