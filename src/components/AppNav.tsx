"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import clsx from "clsx";

export type AppTab = "markets" | "assets" | "portfolio";

const NAV: { id: AppTab; label: string }[] = [
  { id: "markets", label: "Markets" },
  { id: "assets", label: "Assets" },
  { id: "portfolio", label: "Portfolio" },
];

type TabContextValue = {
  tab: AppTab;
  setTab: (tab: AppTab) => void;
};

const TabContext = createContext<TabContextValue | null>(null);

function readTabFromHash(): AppTab {
  if (typeof window === "undefined") return "markets";
  const h = window.location.hash.replace("#", "").toLowerCase();
  if (h === "assets") return "assets";
  if (h === "portfolio" || h === "activity") return "portfolio";
  return "markets";
}

export function TabProvider({ children }: { children: ReactNode }) {
  const [tab, setTabState] = useState<AppTab>("markets");

  useEffect(() => {
    // 挂载后立刻按 hash 同步，避免顶部导航与内容脱节
    setTabState(readTabFromHash());
    const sync = () => setTabState(readTabFromHash());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const setTab = useCallback((next: AppTab) => {
    setTabState(next);
    if (typeof window === "undefined") return;
    const hash = `#${next}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  }, []);

  const value = useMemo(() => ({ tab, setTab }), [tab, setTab]);

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}

export function useAppTab(): [AppTab, (tab: AppTab) => void] {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error("useAppTab must be used within TabProvider");
  return [ctx.tab, ctx.setTab];
}

/** 顶部导航：与页面内容共用同一 Tab 状态 */
export function AppNav({ mobile }: { mobile?: boolean }) {
  const [tab, setTab] = useAppTab();

  if (mobile) {
    return (
      <nav className="flex items-center justify-around border-t border-arc-border bg-white px-2 py-2 md:hidden">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={clsx(
              "flex-1 rounded-lg py-2.5 text-center text-sm font-medium",
              tab === item.id ? "text-arc-ink" : "text-arc-muted"
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {NAV.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setTab(item.id)}
            className={clsx(
            "rounded-lg px-3.5 py-2 text-base font-medium transition-colors",
            tab === item.id
              ? "bg-arc-elevated text-arc-ink"
              : "text-arc-muted hover:bg-arc-elevated/60 hover:text-arc-ink"
          )}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
