import React from 'react';
import { AlertOctagon, Activity, ChevronRight, Wrench } from 'lucide-react';
import { AssetMaster, IncidentReport } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface CriticalAssetWatchlistProps {
  assets: AssetMaster[];
  incidents: IncidentReport[];
  onSelectAsset: (assetId: string) => void;
}

export const CriticalAssetWatchlist: React.FC<CriticalAssetWatchlistProps> = ({
  assets,
  incidents,
  onSelectAsset
}) => {
  // Sort assets: Breakdown first, then Maintenance, then High Criticality Ready
  const watchlist = [...assets].sort((a, b) => {
    const priority = { Breakdown: 3, Maintenance: 2, Ready: 1 };
    return priority[b.status_operasional] - priority[a.status_operasional];
  });

  // Calculate incident count per asset
  const getIncidentCount = (assetId: string) => {
    return incidents.filter(
      (i) => i.asset_id === assetId && i.status_terkini !== 'CLOSED' && i.status_terkini !== 'RESOLVED'
    ).length;
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-rose-950/60 text-rose-400 border border-rose-800/50">
            <AlertOctagon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
              Critical Asset Downtime Watchlist
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              Status Mesin Kritis & Resiko Pelanggaran SLA
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/60">
          Priority SLA
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-56 pr-1">
        {watchlist.slice(0, 5).map((asset) => {
          const activeIncidents = getIncidentCount(asset.asset_id);
          const isCriticalRisk = asset.status_operasional === 'Breakdown' || activeIncidents > 0;

          return (
            <div
              key={asset.asset_id}
              onClick={() => onSelectAsset(asset.asset_id)}
              className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isCriticalRisk
                  ? 'bg-slate-950/80 border-rose-900/40 hover:border-rose-700/60'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-2 h-8 rounded-full shrink-0 ${
                    asset.status_operasional === 'Breakdown'
                      ? 'bg-rose-500 animate-pulse'
                      : asset.status_operasional === 'Maintenance'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white tracking-wider">
                      {asset.asset_id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      [{asset.kategori}]
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 truncate">{asset.nama_aset}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    {asset.lokasi_area}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <StatusBadge status={asset.status_operasional} size="sm" />
                  {activeIncidents > 0 && (
                    <div className="text-[10px] font-mono text-rose-400 mt-1 font-semibold">
                      {activeIncidents} Tiket Aktif
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <span>Total Aset Kritis: {assets.length}</span>
        <span className="text-slate-500">Klik baris aset untuk filter tiket</span>
      </div>
    </div>
  );
};
