"use client";

import { useEffect, useState } from "react";
import { getMarketplaceAddress, getPredictionAddress } from "@/lib/addresses";

export function useContractAddresses() {
  const [marketplace, setMarketplace] = useState<`0x${string}`>(getMarketplaceAddress());
  const [prediction, setPrediction] = useState<`0x${string}`>(getPredictionAddress());

  useEffect(() => {
    const update = () => {
      setMarketplace(getMarketplaceAddress());
      setPrediction(getPredictionAddress());
    };
    window.addEventListener("storage", update);
    const id = setInterval(update, 1000);
    return () => {
      window.removeEventListener("storage", update);
      clearInterval(id);
    };
  }, []);

  const isMarketplaceDeployed = marketplace !== "0x0000000000000000000000000000000000000000";
  const isPredictionDeployed = prediction !== "0x0000000000000000000000000000000000000000";

  return { marketplace, prediction, isMarketplaceDeployed, isPredictionDeployed };
}

export function useRequireDeployment() {
  const { marketplace, prediction } = useContractAddresses();
  return {
    marketplace,
    prediction,
    validateBeforeTx: () => {
      if (marketplace === "0x0000000000000000000000000000000000000000") {
        return "Marketplace not deployed";
      }
      return "";
    },
  };
}
