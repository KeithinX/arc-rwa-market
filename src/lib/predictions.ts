/** 预测市场类型与工具函数 */

export type MarketStatus = "open" | "resolved" | "cancelled";
export type MarketCategory = "NAV" | "APY" | "Price" | "Volume";

export interface PredictionMarket {
  id: number;
  question: string;
  assetSymbol: string;
  category: MarketCategory;
  endTime: number;
  yesPool: number;
  noPool: number;
  status: MarketStatus;
  outcome?: "yes" | "no";
}

/** 合约未部署时的预览市场，保证 Buy Yes/No 等功能按钮可见 */
export const PREVIEW_MARKETS: PredictionMarket[] = [
  {
    id: 1,
    question: "Will aTREAS NAV exceed $1.05 by Q3 2026?",
    assetSymbol: "aTREAS",
    category: "NAV",
    endTime: Date.now() + 90 * 86_400_000,
    yesPool: 12_400,
    noPool: 8_600,
    status: "open",
  },
  {
    id: 2,
    question: "Will aMOT APY stay above 6% this month?",
    assetSymbol: "aMOT",
    category: "APY",
    endTime: Date.now() + 30 * 86_400_000,
    yesPool: 9_200,
    noPool: 5_100,
    status: "open",
  },
  {
    id: 3,
    question: "Will aVCC carbon credits rise 5% in 30 days?",
    assetSymbol: "aVCC",
    category: "Price",
    endTime: Date.now() + 30 * 86_400_000,
    yesPool: 4_800,
    noPool: 6_200,
    status: "open",
  },
  {
    id: 4,
    question: "Will Arc RWA total AUM exceed $100M by end of 2026?",
    assetSymbol: "RWA",
    category: "Volume",
    endTime: Date.now() + 180 * 86_400_000,
    yesPool: 22_000,
    noPool: 11_500,
    status: "open",
  },
  {
    id: 5,
    question: "Will Fed cut rates again in Q3 2026? (aTREAS impact)",
    assetSymbol: "aTREAS",
    category: "NAV",
    endTime: Date.now() + 60 * 86_400_000,
    yesPool: 15_300,
    noPool: 14_800,
    status: "open",
  },
  {
    id: 6,
    question: "Will aMOT occupancy rate stay above 90% in Q3?",
    assetSymbol: "aMOT",
    category: "APY",
    endTime: Date.now() + 45 * 86_400_000,
    yesPool: 7_100,
    noPool: 3_400,
    status: "open",
  },
];

export function calcYesPct(market: PredictionMarket): number {
  const total = market.yesPool + market.noPool;
  if (total === 0) return 50;
  return Math.round((market.yesPool / total) * 100);
}

export function formatTimeLeft(endTime: number): string {
  const diff = endTime - Date.now();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function formatUsdc(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
}
