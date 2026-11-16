import React, { useState, useMemo } from 'react';
import { IncidentReport } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Image as ImageIcon, ChevronRight, AlertCircle } from 'lucide-react';

interface ActiveTicketQueueProps {
  incidents: IncidentReport[];
  searchQuery: string;
  selectedShift?: string;
  onClearShiftFilter?: () => void;
  selectedAssetId?: string | null;
  onClearAssetFilter?: () => void;
  onSelectTicket: (ticket: IncidentReport) => void;
}

type FilterTab = 'ALL' | 'MY_REPORTS' | 'KERUSAKAN' | 'HOUSEKEEPING' | 'CRITICAL';

export const ActiveTicketQueue: React.FC<ActiveTicketQueueProps> = ({
  incidents,
  searchQuery,
  selectedShift = 'ALL',
  onClearShiftFilter,
  selectedAssetId,
  onClearAssetFilter,
  onSelectTicket
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filtered and sorted incidents (prioritizing active critical tickets)
  const filteredIncidents = useMemo(() => {
    const urgencyRank: Record<string, number> = { Critical: 3, Urgent: 2, Normal: 1 };
    const isClosedRank = (status: string) =>
      status === 'RESOLVED' || status === 'CLOSED' ? 1 : 0;

    return incidents
      .filter((ticket) => {
        // Asset filter from watchlist
        if (selectedAssetId && ticket.asset_id !== selectedAssetId) {
          return false;
        }

        // Tab Filter
        if (activeTab === 'MY_REPORTS') {
          const isReporter = ticket.pelapor_email.toLowerCase() === user?.email.toLowerCase();
          const isPic = ticket.pic_teknisi_email?.toLowerCase() === user?.email.toLowerCase();
          if (!isReporter && !isPic) return false;
        } else if (activeTab === 'KERUSAKAN') {
          if (ticket.kategori_laporan !== 'KERUSAKAN') return false;
        } else if (activeTab === 'HOUSEKEEPING') {
          if (ticket.kategori_laporan !== 'ALAT_TIDAK_PADA_TEMPATNYA') return false;
        } else if (activeTab === 'CRITICAL') {
          if (ticket.urgensi !== 'Critical' && ticket.urgensi !== 'Urgent') return false;
        }

        // Status dropdown filter
        if (statusFilter !== 'ALL' && ticket.status_terkini !== statusFilter) {
          return false;
        }

        // Global text search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = ticket.ticket_id.toLowerCase().includes(q);
          const matchAsset = ticket.asset_id.toLowerCase().includes(q);
          const matchLoc = ticket.lokasi_detail.toLowerCase().includes(q);
          const matchDesc = ticket.deskripsi.toLowerCase().includes(q);
          const matchReporter = ticket.pelapor_nama.toLowerCase().includes(q);
          const matchPic = (ticket.pic_teknisi_nama || '').toLowerCase().includes(q);

          if (!matchId && !matchAsset && !matchLoc && !matchDesc && !matchReporter && !matchPic) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const closedDiff = isClosedRank(a.status_terkini) - isClosedRank(b.status_terkini);
        if (closedDiff !== 0) return closedDiff;
        const urgDiff = (urgencyRank[b.urgensi] || 0) - (urgencyRank[a.urgensi] || 0);
        if (urgDiff !== 0) return urgDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [incidents, activeTab, statusFilter, searchQuery, selectedAssetId, user]);

  const tabs: Array<{ id: FilterTab; label: string; count: number }> = [
    { id: 'ALL', label: 'Semua Tiket', count: incidents.length },
    {
      id: 'MY_REPORTS',
      label: 'Tiket Saya',
      count: incidents.filter(
        (i) =>
          i.pelapor_email.toLowerCase() === user?.email.toLowerCase() ||
          i.pic_teknisi_email?.toLowerCase() === user?.email.toLowerCase()
      ).length
    },
    {
      id: 'KERUSAKAN',
      label: 'Kerusakan Alat',
      count: incidents.filter((i) => i.kategori_laporan === 'KERUSAKAN').length
    },
    {
      id: 'HOUSEKEEPING',
      label: '5R Housekeeping',
      count: incidents.filter((i) => i.kategori_laporan === 'ALAT_TIDAK_PADA_TEMPATNYA').length
    },
    {
      id: 'CRITICAL',
      label: 'Urgent / Critical',
      count: incidents.filter((i) => i.urgensi === 'Critical' || i.urgensi === 'Urgent').length
    }
  ];

  const getTicketAgeInfo = (ticket: IncidentReport) => {
    try {
      const endMs =
        (ticket.status_terkini === 'RESOLVED' || ticket.status_terkini === 'CLOSED') &&
        ticket.resolved_at
          ? new Date(ticket.resolved_at).getTime()
          : Date.now();
      const diffMs = Math.max(0, endMs - new Date(ticket.created_at).getTime());
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = diffMs / 3600000;
      const isActive =
        ticket.status_terkini !== 'RESOLVED' && ticket.status_terkini !== 'CLOSED';
      const isSlaBreach = isActive && diffHours >= 3;

      let label = `${diffMins}m lalu`;
      if (diffMins >= 60 && diffHours < 24) label = `${Math.floor(diffHours)}j lalu`;
      else if (diffHours >= 24) label = `${Math.floor(diffHours / 24)}h lalu`;

      return { label, isSlaBreach };
    } catch {
      return { label: '-', isSlaBreach: false };
    }
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden">
      {/* Tab Filter Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-800 border border-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums ${
                  activeTab === tab.id
                    ? 'bg-slate-700 text-slate-100'
                    : 'bg-slate-900 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Status Dropdown Filter & Active Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedShift !== 'ALL' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-950/50 border border-cyan-800/60 text-xs font-mono text-cyan-300">
              <span>Shift: {selectedShift}</span>
              {onClearShiftFilter && (
                <button
                  onClick={onClearShiftFilter}
                  className="hover:text-white font-bold ml-1"
                  title="Hapus filter shift"
                >
                  Ã—
                </button>
              )}
            </div>
          )}

          {selectedAssetId && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/40 border border-rose-800/60 text-xs font-mono text-rose-300">
              <span>Aset: {selectedAssetId}</span>
              <button
                onClick={onClearAssetFilter}
                className="hover:text-white font-bold ml-1"
                title="Hapus filter aset"
              >
                Ã—
              </button>
            </div>
          )}

          <select
            aria-label="Filter Status Tiket"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="tv-hide bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="ON_HOLD">ON HOLD</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </div>

      {/* Ticket Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Ticket ID</th>
              <th className="py-2.5 px-3">Kategori</th>
              <th className="py-2.5 px-3">Aset / Lokasi</th>
              <th className="py-2.5 px-3">Urgensi</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Pelapor</th>
              <th className="py-2.5 px-3">PIC Teknisi</th>
              <th className="py-2.5 px-3 text-right">Durasi / SLA</th>
              <th className="py-2.5 px-3 text-center tv-hide">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 font-mono">
                  Tidak ada tiket incident yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((ticket) => {
                const age = getTicketAgeInfo(ticket);
                return (
                  <tr
                    key={ticket.ticket_id}
                    onClick={() => onSelectTicket(ticket)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Ticket ID */}
                    <td className="py-3 px-3 font-mono font-bold text-white tabular-nums whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {ticket.foto_awal_url ? (
                          <ImageIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : null}
                        <span>{ticket.ticket_id}</span>
                      </div>
                    </td>

                    {/* Kategori */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={ticket.kategori_laporan} size="sm" showDot={false} />
                    </td>

                    {/* Aset / Lokasi */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-mono font-semibold text-slate-200">
                        {ticket.asset_id}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {ticket.lokasi_detail}
                      </div>
                    </td>

                    {/* Urgensi */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={ticket.urgensi} size="sm" />
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={ticket.status_terkini} size="sm" />
                    </td>

                    {/* Pelapor */}
                    <td className="py-3 px-3 hidden md:table-cell">
                      <div className="text-slate-200 font-medium truncate max-w-[130px]">
                        {ticket.pelapor_nama}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[130px]">
                        {ticket.pelapor_unit}
                      </div>
                    </td>

                    {/* PIC Teknisi */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {ticket.pic_teknisi_nama ? (
                        <span className="text-amber-300 font-mono text-xs">
                          {ticket.pic_teknisi_nama}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px] italic">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Waktu & SLA Indicator */}
                    <td className="py-3 px-3 text-right font-mono text-[11px] tabular-nums whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          age.isSlaBreach ? 'text-rose-400 font-bold' : 'text-slate-400'
                        }`}
                        title={age.isSlaBreach ? 'Melebihi target SLA 3.0 Jam' : 'Dalam batas SLA'}
                      >
                        {age.isSlaBreach && <AlertCircle className="w-3 h-3 shrink-0" />}
                        {age.label}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-3 text-center tv-hide">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(ticket);
                        }}
                        className="p-1 rounded text-slate-400 group-hover:text-cyan-300 group-hover:bg-slate-800 transition-colors"
                        title="Buka Detail & Timeline"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <span>
          Menampilkan <span className="text-white font-semibold">{filteredIncidents.length}</span> dari{' '}
          <span className="text-white font-semibold">{incidents.length}</span> tiket
        </span>
        <span className="text-[11px] text-slate-500 tv-hide">
          Klik baris untuk membuka detail histori, foto Before/After & tindakan
        </span>
      </div>
    </div>
  );
};
