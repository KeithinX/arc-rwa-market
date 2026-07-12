"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { arcTestnet, USDC_ADDRESS } from "@/lib/arc";
import { ERC20_ABI } from "@/lib/contracts";
import { useAssets } from "@/hooks/useAssets";
import clsx from "clsx";

export function Portfolio({ compact }: { compact?: boolean }) {
  const { address } = useAccount();
  const assets = useAssets();

  const { data: usdcBalance } = useReadContract({
    chainId: arcTestnet.id,
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  if (!address) {
    return (
      <div className={clsx(compact ? "pt-1" : "")}>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-arc-muted">
          Wallet
        </p>
        <p className="text-sm text-arc-muted">Connect wallet to view balances.</p>
      </div>
    );
  }

  const usdc = usdcBalance ? Number(formatUnits(usdcBalance, 6)) : 0;

  return (
    <div className={clsx(compact ? "pt-1" : "")}>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-arc-muted">USDC</p>
      <p className="mb-5 font-mono text-2xl font-semibold text-arc-ink">
        ${usdc.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>

      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-arc-muted">
        Token balances
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-arc-border text-left text-[11px] text-arc-muted">
              <th className="pb-2 font-medium">Asset</th>
              <th className="pb-2 text-right font-medium">Qty</th>
              <th className="pb-2 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <TokenRow key={a.id} asset={a} owner={address} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TokenRow({
  asset,
  owner,
}: {
  asset: ReturnType<typeof useAssets>[number];
  owner: `0x${string}`;
}) {
  const { data: balance } = useReadContract({
    chainId: arcTestnet.id,
    address: asset.tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [owner],
    query: { enabled: asset.tokenAddress !== "0x0000000000000000000000000000000000000000" },
  });

  if (!balance || balance === 0n) return null;

  const qty = Number(formatUnits(balance, 18));
  const value = qty * Number(asset.details.nav);

  return (
    <tr className="border-b border-arc-border/50 last:border-0">
      <td className="py-2.5 font-medium text-arc-ink">{asset.symbol}</td>
      <td className="py-2.5 text-right font-mono text-arc-muted">{qty.toFixed(2)}</td>
      <td className="py-2.5 text-right font-mono text-arc-ink">
        ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </td>
    </tr>
  );
}
