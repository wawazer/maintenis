import React from 'react';
import { AlertOctagon, ChevronRight } from 'lucide-react';
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
  const watchlist = [...assets].sort((a, b) => {
    const priority = { Breakdown: 3, Maintenance: 2, Ready: 1 };
    return priority[b.status_operasional] - priority[a.status_operasional];
  });

  const getIncidentCount = (assetId: string) => {
    return incidents.filter(
      (i) => i.asset_id === assetId && i.status_terkini !== 'CLOSED' && i.status_terkini !== 'RESOLVED'
    ).length;
  };

  return (
    <div className="rounded-[12px] border border-[#292a4d] bg-[#0c0a2b] p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-[#13151f] border border-[#202333] flex items-center justify-center text-[#ff3a63]">
            <AlertOctagon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-[15px] font-display font-semibold tracking-[0.013em] text-white">
              Critical Asset Downtime Watchlist
            </h3>
            <p className="text-xs text-[#9b9ba4]">
              Status mesin kritis & risiko pelanggaran SLA
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-[30px] bg-[#13151f] text-white border border-[#ff3a63]/70 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff3a63]" />
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
              className={`p-2.5 rounded-[12px] border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                isCriticalRisk
                  ? 'bg-[#13151f] border-[#ff3a63]/40 hover:bg-[#2c2b52]/50'
                  : 'bg-[#13151f] border-[#202333] hover:bg-[#2c2b52]/40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-1.5 h-7 rounded-[30px] shrink-0 ${
                    asset.status_operasional === 'Breakdown'
                      ? 'bg-[#ff3a63]'
                      : asset.status_operasional === 'Maintenance'
                      ? 'bg-[#0067ff]'
                      : 'bg-[#ffff00]'
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-white tabular-nums">
                      {asset.asset_id}
                    </span>
                    <span className="text-[11px] text-[#9b9ba4]">
                      â€¢ {asset.kategori}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#b4b4bb] truncate">{asset.nama_aset}</p>
                  <p className="text-[11px] text-[#9b9ba4] truncate">
                    {asset.lokasi_area}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <StatusBadge status={asset.status_operasional} size="sm" />
                  {activeIncidents > 0 && (
                    <div className="text-[11px] text-[#ff3a63] mt-1 font-medium tabular-nums">
                      {activeIncidents} Tiket Aktif
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-[#9b9ba4]" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#202333] text-xs text-[#9b9ba4] flex items-center justify-between tabular-nums">
        <span>Total Aset Kritis: <strong className="text-white font-medium">{assets.length}</strong></span>
        <span>Klik baris aset untuk filter tiket</span>
      </div>
    </div>
  );
};
