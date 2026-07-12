"use client";

import { useState, useEffect } from "react";
import type { RWAAsset } from "@/lib/arc";
import { getStoredAddress } from "@/lib/addresses";

// Minimal asset registry. Metadata is static; addresses come from environment or localStorage.
export function useAssets(): RWAAsset[] {
  const [assets, setAssets] = useState<RWAAsset[]>([]);

  useEffect(() => {
    const treasury = getStoredAddress("arc_token_treasury", process.env.NEXT_PUBLIC_TOKEN_TREASURY);
    const realestate = getStoredAddress("arc_token_realestate", process.env.NEXT_PUBLIC_TOKEN_REALESTATE);
    const carbon = getStoredAddress("arc_token_carbon", process.env.NEXT_PUBLIC_TOKEN_CARBON);

    const now = Date.now();

    setAssets([
      {
        id: "treasury-bond",
        name: "Arc Treasury Bond 2026",
        symbol: "aTREAS",
        type: "Government Bond",
        value: 10_000_000,
        apy: 4.8,
        risk: "Low",
        tokenAddress: treasury,
        description: "Tokenized U.S. Treasury bonds held by a regulated custodian, 1:1 backed.",
        image: "",
        spark: [],
        change24h: 0,
        details: {
          custodian: "BNY Mellon",
          auditor: "Deloitte",
          nav: "1.02",
          navUnit: "USDC / share",
          lastValuation: new Date(now).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          distribution: "Semi-annual coupon",
          domicile: "United States",
          legalStructure: "US Treasury direct holding",
          underlying: "6-month US T-Bills",
          compliance: "SEC Reg D",
          iso: "ISO 20022 compatible",
        },
      },
      {
        id: "real-estate",
        name: "Manhattan Office Tower",
        symbol: "aMOT",
        type: "Commercial Real Estate",
        value: 50_000_000,
        apy: 6.2,
        risk: "Medium",
        tokenAddress: realestate,
        description: "Tokenized income rights of a Manhattan Grade-A office tower.",
        image: "",
        spark: [],
        change24h: 0,
        details: {
          custodian: "State Street Digital",
          auditor: "PwC",
          nav: "50.00",
          navUnit: "USDC / share",
          lastValuation: new Date(now).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          distribution: "Monthly rent distribution",
          domicile: "New York, USA",
          legalStructure: "SPV",
          underlying: "Grade-A office tower, 92% occupied",
          compliance: "SEC Reg D 506(c)",
          iso: "ERC-3643 permissioned tokens",
        },
      },
      {
        id: "carbon-credit",
        name: "Verified Carbon Credits 2026",
        symbol: "aVCC",
        type: "Carbon Credit",
        value: 2_000_000,
        apy: 8.5,
        risk: "Medium-High",
        tokenAddress: carbon,
        description: "Verra-verified carbon credits for ESG portfolio allocation.",
        image: "",
        spark: [],
        change24h: 0,
        details: {
          custodian: "Verra Registry",
          auditor: "TÜV NORD",
          nav: "12.50",
          navUnit: "USDC / credit",
          lastValuation: new Date(now).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          distribution: "Trading-only",
          domicile: "International",
          legalStructure: "Tokenized verified offset credits",
          underlying: "REDD+ Amazon rainforest project",
          compliance: "ICVCM Core Carbon Principles",
          iso: "ERC-20 with retirement registry",
        },
      },
    ]);
  }, []);

  return assets;
}

export function findAssetByToken(assets: RWAAsset[], token: string): RWAAsset | undefined {
  return assets.find((a) => a.tokenAddress.toLowerCase() === token.toLowerCase());
}
