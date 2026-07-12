"use client";

import { useState } from "react";
import { parseUnits, formatUnits, type Address } from "viem";
import { useAccount, useReadContract } from "wagmi";
import type { RWAAsset } from "@/lib/arc";
import { arcTestnet, USDC_ADDRESS } from "@/lib/arc";
import { MARKETPLACE_ABI, ERC20_ABI } from "@/lib/contracts";
import { useArcWrite } from "@/hooks/useArcWrite";
import { useRequireDeployment } from "@/hooks/useContractAddresses";
import { ensureArcNetwork } from "@/lib/wallet";
import clsx from "clsx";

type Tab = "buy" | "sell";

export function TradeModal({ asset, onClose }: { asset: RWAAsset; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("buy");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="modal-enter w-full max-w-md rounded-xl border border-arc-border bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-arc-border p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-arc-accent">{asset.symbol}</p>
            <p className="mt-1 text-lg font-semibold text-arc-ink">{asset.name}</p>
            <p className="mt-1 text-xs text-arc-muted">
              <span className={asset.risk === "Low" ? "text-arc-yes" : asset.risk === "Medium" ? "text-arc-warning" : "text-arc-no"}>
                {asset.risk} risk
              </span>
              <span className="mx-1">·</span>
              <span>{asset.apy}% APY</span>
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost h-8 w-8 p-0">✕</button>
        </div>

        <div className="mx-6 mt-5 grid grid-cols-2 gap-1 rounded-lg border border-arc-border p-1">
          {(["buy", "sell"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "rounded-md py-2 text-sm font-semibold capitalize transition-colors",
                tab === t ? "bg-arc-ink text-white" : "text-arc-muted hover:text-arc-ink"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "buy" ? <BuyTab asset={asset} /> : <SellTab asset={asset} />}
        </div>
      </div>
    </div>
  );
}

function BuyTab({ asset }: { asset: RWAAsset }) {
  const { address } = useAccount();
  const { marketplace, validateBeforeTx } = useRequireDeployment();
  const { writeAndWait, isPending } = useArcWrite();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");

  const { data: listing } = useReadContract({
    chainId: arcTestnet.id,
    address: marketplace,
    abi: MARKETPLACE_ABI,
    functionName: "listings",
    args: [BigInt(1)],
    query: { enabled: marketplace !== "0x0000000000000000000000000000000000000000" },
  });

  const price = listing ? Number(formatUnits(listing[3], 6)) : Number(asset.details.nav);
  const total = amount ? (Number(amount) * price).toFixed(2) : "0.00";

  async function handleBuy() {
    const err = validateBeforeTx();
    if (err) { setStatus(err); return; }
    if (!address || !listing) return;
    try {
      await ensureArcNetwork();
      const buyWei = parseUnits(amount, 18);
      const totalUsdc = parseUnits(total, 6);
      await writeAndWait({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: "approve", args: [marketplace, totalUsdc] });
      await writeAndWait({ address: marketplace, abi: MARKETPLACE_ABI, functionName: "buy", args: [BigInt(1), buyWei] });
      setStatus("Done");
    } catch (e) {
      setStatus((e as Error).message.slice(0, 40));
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-arc-border bg-arc-elevated/50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-arc-muted">Price per share</p>
        <p className="font-mono text-xl font-semibold text-arc-ink">${price.toFixed(2)}</p>
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-arc-muted">Amount</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="input" />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-arc-border p-3">
        <span className="text-sm text-arc-muted">Total</span>
        <span className="font-mono font-semibold text-arc-ink">${total} USDC</span>
      </div>
      <button onClick={handleBuy} disabled={isPending || !amount || Number(amount) <= 0} className="btn-primary w-full">
        {isPending ? "Confirming…" : status || "Buy shares"}
      </button>
    </div>
  );
}

function SellTab({ asset }: { asset: RWAAsset }) {
  const { address } = useAccount();
  const { marketplace, validateBeforeTx } = useRequireDeployment();
  const { writeAndWait, isPending } = useArcWrite();
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState<string>(asset.details.nav);
  const [status, setStatus] = useState("");

  const { data: balance } = useReadContract({
    chainId: arcTestnet.id,
    address: asset.tokenAddress as Address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && asset.tokenAddress !== "0x0000000000000000000000000000000000000000" },
  });

  const max = balance ? formatUnits(balance, 18) : "0";
  const total = amount ? (Number(amount) * Number(price)).toFixed(2) : "0.00";

  async function handleSell() {
    const err = validateBeforeTx();
    if (err) { setStatus(err); return; }
    if (!address || !amount) return;
    try {
      await ensureArcNetwork();
      const sellWei = parseUnits(amount, 18);
      const pricePerUnit = parseUnits(price, 6);
      await writeAndWait({ address: asset.tokenAddress as Address, abi: ERC20_ABI, functionName: "approve", args: [marketplace, sellWei] });
      await writeAndWait({ address: marketplace, abi: MARKETPLACE_ABI, functionName: "list", args: [asset.tokenAddress, sellWei, pricePerUnit] });
      setStatus("Listed");
    } catch (e) {
      setStatus((e as Error).message.slice(0, 40));
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-arc-border bg-arc-elevated/50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-arc-muted">Available</p>
        <p className="font-mono text-xl font-semibold text-arc-ink">{Number(max).toLocaleString()} {asset.symbol}</p>
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-arc-muted">Amount</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="input" />
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-arc-muted">Price per share (USDC)</label>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input" />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-arc-border p-3">
        <span className="text-sm text-arc-muted">Total</span>
        <span className="font-mono font-semibold text-arc-ink">${total} USDC</span>
      </div>
      <button onClick={handleSell} disabled={isPending || !amount || Number(amount) <= 0} className="btn-primary w-full">
        {isPending ? "Listing…" : status || "List for sale"}
      </button>
    </div>
  );
}
