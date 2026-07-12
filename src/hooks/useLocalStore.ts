"use client";

import { useCallback, useEffect, useState } from "react";

/** 本地持久化：自选、持仓、模拟成交 */
export function useLocalStore<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* ignore */
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, set, ready] as const;
}

export type Position = {
  id: string;
  marketId: number;
  question: string;
  assetSymbol: string;
  side: "yes" | "no";
  amount: number;
  entryPrice: number;
  createdAt: number;
};

export type LocalTrade = {
  id: string;
  marketId: number;
  side: "yes" | "no";
  amount: number;
  price: number;
  at: number;
};
