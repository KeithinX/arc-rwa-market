"use client";

import { type PredictionMarket } from "@/lib/predictions";

export function PredictionCard({
  market,
  onPredict,
}: {
  market: PredictionMarket;
  onPredict: (market: PredictionMarket, side: "yes" | "no") => void;
}) {
  return null;
}
