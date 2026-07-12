"use client";

import { useState } from "react";
import { parseUnits, formatUnits, createPublicClient, http } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { CheckCircle2, Loader2 } from "lucide-react";
import clsx from "clsx";
import type { PredictionMarket } from "@/lib/predictions";
import { calcYesPct, formatUsdc } from "@/lib/predictions";
import { USDC_ADDRESS, arcTestnet, ARC_RPC_URL } from "@/lib/arc";
import { PREDICTION_ABI, ERC20_ABI } from "@/lib/contracts";
import { useArcWrite } from "@/hooks/useArcWrite";
import { useContractAddresses } from "@/hooks/useContractAddresses";
import { ensureArcNetwork } from "@/lib/wallet";
import { isZeroAddress } from "@/lib/addresses";
import { ProbabilityBar } from "./MarketCard";

type Step = "input" | "pending" | "success" | "error";

export function PredictModal({
  market,
  side,
  onClose,
  preview = false,
  onFilled,
}: {
  market: PredictionMarket;
  side: "yes" | "no";
  onClose: () => void;
  preview?: boolean;
  onFilled?: (payload: { amount: number; price: number; side: "yes" | "no" }) => void;
}) {
  const isClaim = market.status === "resolved";
  const [amount, setAmount] = useState("100");
  const [step, setStep] = useState<Step>("input");
  const [errorMsg, setErrorMsg] = useState("");
  const [txHash, setTxHash] = useState("");

  const { address } = useAccount();
  const { prediction, isPredictionDeployed } = useContractAddresses();
  const { writeAndWait, isPending } = useArcWrite();

  const yesPct = calcYesPct(market);
  const isYes = side === "yes";
  const entryPrice = isYes ? yesPct : 100 - yesPct;
  const usePreview = preview || !isPredictionDeployed || isZeroAddress(prediction as string);

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS, abi: ERC20_ABI, functionName: "balanceOf",
    args: address ? [address] : undefined, query: { enabled: !!address },
  });
  const { data: yesShares } = useReadContract({
    address: prediction, abi: PREDICTION_ABI, functionName: "yesShares",
    args: address ? [BigInt(market.id), address] : undefined, query: { enabled: !!address && isPredictionDeployed && !usePreview },
  });
  const { data: noShares } = useReadContract({
    address: prediction, abi: PREDICTION_ABI, functionName: "noShares",
    args: address ? [BigInt(market.id), address] : undefined, query: { enabled: !!address && isPredictionDeployed && !usePreview },
  });

  async function handleSubmit() {
    setStep("pending");
    setErrorMsg("");
    try {
      // 预览模式：走完交互流程，不发链上交易
      if (usePreview) {
        await new Promise((r) => setTimeout(r, 900));
        if (!isClaim) {
          onFilled?.({ amount: Number(amount) || 0, price: entryPrice, side });
        }
        setTxHash("");
        setStep("success");
        return;
      }

      if (!address) {
        setErrorMsg("Connect wallet first");
        setStep("error");
        return;
      }

      await ensureArcNetwork();
      if (isClaim) {
        const hash = await writeAndWait({
          address: prediction as `0x${string}`,
          abi: PREDICTION_ABI,
          functionName: "claim",
          args: [BigInt(market.id)],
        });
        setTxHash(hash);
        setStep("success");
        return;
      }

      const parsed = parseUnits(amount || "0", 6);
      const client = createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) });
      const allowance = await client.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, prediction as `0x${string}`],
      });
      if (allowance < parsed) {
        await writeAndWait({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [prediction as `0x${string}`, parsed * 10n],
        });
      }
      const hash = await writeAndWait({
        address: prediction as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: isYes ? "buyYes" : "buyNo",
        args: [BigInt(market.id), parsed],
      });
      setTxHash(hash);
      if (!isClaim) {
        onFilled?.({ amount: Number(amount) || 0, price: entryPrice, side });
      }
      setStep("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message.slice(0, 120) : "Transaction failed");
      setStep("error");
    }
  }

  const userShares = isYes ? yesShares : noShares;
  const balanceStr = usdcBalance ? formatUnits(usdcBalance as bigint, 6) : "—";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="modal-enter w-full max-w-md rounded-xl border border-arc-border bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-arc-border p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-arc-muted">
              {isClaim ? "Claim reward" : `Buy ${side === "yes" ? "Yes" : "No"}`} · {market.assetSymbol}
            </p>
            <p className="mt-1 text-[15px] leading-snug text-arc-ink">{market.question}</p>
          </div>
          <button onClick={onClose} className="btn-ghost h-8 w-8 p-0">✕</button>
        </div>

        <div className="p-6">
          {step === "input" && (
            <>
              <div className="mb-5">
                <ProbabilityBar yesPct={yesPct} />
              </div>

              {!isClaim && (
                <div className="mb-5">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-arc-muted">Amount (USDC)</label>
                  <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" />
                  <div className="mt-2 flex gap-2">
                    {["10", "50", "100", "500"].map((v) => (
                      <button key={v} onClick={() => setAmount(v)} className="btn-ghost text-[11px]">${v}</button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-arc-muted">
                    Balance {balanceStr} USDC
                  </p>
                </div>
              )}

              {isClaim && userShares !== undefined && (
                <p className="mb-5 font-mono text-sm text-arc-yes">
                  Position {formatUsdc(Number(formatUnits((userShares as bigint) ?? 0n, 6)))}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={isPending || (!isClaim && (!amount || Number(amount) <= 0))}
                className={clsx("btn-primary w-full", !isClaim && !isYes && "!bg-arc-no")}
              >
                {isClaim ? "Claim" : `Confirm ${side} · $${amount || "0"}`}
              </button>
            </>
          )}

          {step === "pending" && (
            <div className="py-10 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-arc-accent" />
              <p className="mt-3 text-[12px] text-arc-muted">Confirming…</p>
            </div>
          )}

          {step === "success" && (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-7 w-7 text-arc-yes" />
              <p className="mt-3 font-medium text-arc-ink">{isClaim ? "Claimed" : `${side} position opened`}</p>
              <p className="mt-1 text-[11px] text-arc-muted">
                {txHash
                  ? `${txHash.slice(0, 12)}…${txHash.slice(-6)}`
                  : usePreview
                    ? "Order simulated"
                    : "Confirmed"}
              </p>
              <button onClick={onClose} className="btn-primary mt-5">Close</button>
            </div>
          )}

          {step === "error" && (
            <div className="py-8 text-center">
              <p className="text-[12px] text-arc-no">{errorMsg}</p>
              <button onClick={() => setStep("input")} className="btn-ghost mt-4">Retry</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
