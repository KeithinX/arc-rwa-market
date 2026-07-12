"use client";

import { useState } from "react";
import { useReadContract, useAccount } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { arcTestnet, USDC_ADDRESS } from "@/lib/arc";
import { MARKETPLACE_ABI, ERC20_ABI } from "@/lib/contracts";
import { useArcWrite } from "@/hooks/useArcWrite";
import { useRequireDeployment, useContractAddresses } from "@/hooks/useContractAddresses";
import { useAssets, findAssetByToken } from "@/hooks/useAssets";
import { ensureArcNetwork } from "@/lib/wallet";

function ListingRow({ id }: { id: number }) {
  const { address } = useAccount();
  const [buyAmount, setBuyAmount] = useState("");
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);
  const { writeAndWait, isPending } = useArcWrite();
  const { marketplace, validateBeforeTx } = useRequireDeployment();
  const assets = useAssets();

  const { data } = useReadContract({
    chainId: arcTestnet.id,
    address: marketplace,
    abi: MARKETPLACE_ABI,
    functionName: "listings",
    args: [BigInt(id)],
    query: { enabled: marketplace !== "0x0000000000000000000000000000000000000000" },
  });

  if (!data || !data[4]) return null;

  const [seller, rwaToken, amount, pricePerUnit] = data;
  const asset = findAssetByToken(assets, rwaToken as string);
  const totalPrice = (Number(formatUnits(amount, 18)) * Number(formatUnits(pricePerUnit, 6))).toFixed(2);
  const maxAmount = formatUnits(amount, 18);
  const isOwn = !!address && (seller as string).toLowerCase() === address.toLowerCase();

  async function handleBuy() {
    const err = validateBeforeTx();
    if (err || !address) { setStatus(err || "wallet"); return; }
    try {
      await ensureArcNetwork();
      const amt = buyAmount || maxAmount;
      const buyWei = parseUnits(amt, 18);
      const totalUsdc = parseUnits((Number(amt) * Number(formatUnits(pricePerUnit, 6))).toFixed(6), 6);
      setStatus("approve");
      await writeAndWait({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: "approve", args: [marketplace, totalUsdc] });
      setStatus("buy");
      await writeAndWait({ address: marketplace, abi: MARKETPLACE_ABI, functionName: "buy", args: [BigInt(id), buyWei] });
      setStatus("ok");
      setDone(true);
    } catch (e: unknown) {
      setStatus(((e as Error).message || "err").slice(0, 20));
    }
  }

  async function handleCancel() {
    const err = validateBeforeTx();
    if (err || !address) return;
    try {
      await ensureArcNetwork();
      await writeAndWait({ address: marketplace, abi: MARKETPLACE_ABI, functionName: "cancel", args: [BigInt(id)] });
      setDone(true);
    } catch (e: unknown) {
      setStatus(((e as Error).message || "err").slice(0, 20));
    }
  }

  return (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-arc-elevated text-[10px] text-arc-ink">
            {asset?.symbol?.slice(1, 3) ?? "?"}
          </div>
          <div>
            <p className="text-arc-ink">{asset?.name ?? "Unknown"}</p>
            <p className="text-[10px] text-arc-muted">{asset?.symbol}</p>
          </div>
        </div>
      </td>
      <td className="font-mono text-sm">{maxAmount}</td>
      <td className="font-mono text-sm">{formatUnits(pricePerUnit, 6)} USDC</td>
      <td className="font-mono text-sm text-arc-accent">{totalPrice} USDC</td>
      <td className="font-mono text-[11px] text-arc-muted">
        {(seller as string).slice(0, 6)}…{(seller as string).slice(-4)}
      </td>
      <td>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={maxAmount}
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            disabled={isOwn || done}
            className="w-20 border border-arc-border bg-arc-bg px-2 py-1 font-mono text-[11px] text-arc-ink outline-none focus:border-arc-accent disabled:opacity-30 rounded-lg"
          />
          {isOwn ? (
            <button onClick={handleCancel} disabled={isPending} className="btn-no text-[11px]">
              {isPending ? "…" : "Cancel"}
            </button>
          ) : (
            <button onClick={handleBuy} disabled={!address || isPending || done} className="btn-primary text-[11px]">
              {isPending ? status : done ? "Done" : "Buy"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function ListingsTable({ embedded }: { embedded?: boolean }) {
  const { marketplace } = useContractAddresses();
  const { data: count } = useReadContract({
    chainId: arcTestnet.id,
    address: marketplace,
    abi: MARKETPLACE_ABI,
    functionName: "listingCount",
    query: { enabled: marketplace !== "0x0000000000000000000000000000000000000000" },
  });

  const ids = count ? Array.from({ length: Number(count) }, (_, i) => i + 1) : [];

  const table = (
    <div className="overflow-x-auto">
      {ids.length === 0 ? (
        <p className="px-5 py-10 text-center text-[12px] text-arc-muted">No active orders</p>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th>Seller</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {ids.map((id) => <ListingRow key={id} id={id} />)}
          </tbody>
        </table>
      )}
    </div>
  );

  if (embedded) return table;
  return <div className="panel">{table}</div>;
}
