"use client";

import type { RWAAsset } from "@/lib/arc";

export function AssetDetailsModal({
  asset,
  onClose,
  onTrade,
}: {
  asset: RWAAsset;
  onClose: () => void;
  onTrade: (a: RWAAsset) => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="modal-enter w-full max-w-lg card">
        <div className="flex items-start justify-between border-b border-arc-border p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-arc-accent">{asset.symbol}</p>
            <p className="mt-1 text-lg font-semibold text-arc-ink">{asset.name}</p>
          </div>
          <button onClick={onClose} className="btn-ghost h-8 w-8 p-0">✕</button>
        </div>

        <div className="p-6">
          <div className="mb-5 grid grid-cols-2 gap-4">
            {Object.entries({
              Custodian: asset.details.custodian,
              Auditor: asset.details.auditor,
              Structure: asset.details.legalStructure,
              Underlying: asset.details.underlying,
              Compliance: asset.details.compliance,
              Domicile: asset.details.domicile,
              Distribution: asset.details.distribution,
              Standard: asset.details.iso,
            }).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-arc-border p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-arc-muted">{k}</p>
                <p className="mt-1 text-xs text-arc-ink">{v}</p>
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-arc-muted">{asset.description}</p>
          <div className="mt-6 flex gap-3">
            <button onClick={() => { onClose(); onTrade(asset); }} className="btn-primary flex-1">Trade</button>
            <button onClick={onClose} className="btn-outline flex-1">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
