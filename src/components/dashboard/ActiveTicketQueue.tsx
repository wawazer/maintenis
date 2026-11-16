import React, { useState, useMemo } from 'react';
import {
  IncidentReport,
  TicketCategory,
  TicketStatus,
  UrgencyLevel
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import {
  Filter,
  Image as ImageIcon,
  User,
  Clock,
  ArrowUpDown,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ActiveTicketQueueProps {
  incidents: IncidentReport[];
  searchQuery: string;
  selectedAssetId?: string | null;
  onClearAssetFilter?: () => void;
  onSelectTicket: (ticket: IncidentReport) => void;
}

type FilterTab = 'ALL' | 'MY_REPORTS' | 'KERUSAKAN' | 'HOUSEKEEPING' | 'CRITICAL';

export const ActiveTicketQueue: React.FC<ActiveTicketQueueProps> = ({
  incidents,
  searchQuery,
  selectedAssetId,
  onClearAssetFilter,
  onSelectTicket
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filtered and sorted incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((ticket) => {
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

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      if (diffMins < 60) return `${diffMins}m lalu`;
      if (diffHours < 24) return `${diffHours}j lalu`;
      return `${Math.floor(diffHours / 24)}h lalu`;
    } catch (e) {
      return '-';
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

        {/* Status Dropdown Filter & Asset Clear pill */}
        <div className="flex items-center gap-2">
          {selectedAssetId && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/40 border border-rose-800/60 text-xs font-mono text-rose-300">
              <span>Filter Aset: {selectedAssetId}</span>
              <button
                onClick={onClearAssetFilter}
                className="hover:text-white font-bold ml-1"
                title="Hapus filter aset"
              >
                ×
              </button>
            </div>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer"
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
              <th className="py-2.5 px-3">Pelapor</th>
              <th className="py-2.5 px-3">PIC Teknisi</th>
              <th className="py-2.5 px-3 text-right">Waktu</th>
              <th className="py-2.5 px-3 text-center">Aksi</th>
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
              filteredIncidents.map((ticket) => (
                <tr
                  key={ticket.ticket_id}
                  onClick={() => onSelectTicket(ticket)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  {/* Ticket ID */}
                  <td className="py-3 px-3 font-mono font-bold text-white tabular-nums">
                    <div className="flex items-center gap-1.5">
                      {ticket.foto_awal_url ? (
                        <ImageIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      ) : null}
                      <span>{ticket.ticket_id}</span>
                    </div>
                  </td>

                  {/* Kategori */}
                  <td className="py-3 px-3">
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
                  <td className="py-3 px-3">
                    <StatusBadge status={ticket.urgensi} size="sm" />
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    <StatusBadge status={ticket.status_terkini} size="sm" />
                  </td>

                  {/* Pelapor */}
                  <td className="py-3 px-3">
                    <div className="text-slate-200 font-medium truncate max-w-[120px]">
                      {ticket.pelapor_nama}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                      {ticket.pelapor_unit}
                    </div>
                  </td>

                  {/* PIC Teknisi */}
                  <td className="py-3 px-3">
                    {ticket.pic_teknisi_nama ? (
                      <span className="text-amber-300 font-mono text-xs">
                        {ticket.pic_teknisi_nama}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Waktu */}
                  <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-400 tabular-nums">
                    {formatRelativeTime(ticket.created_at)}
                  </td>

                  {/* Aksi */}
                  <td className="py-3 px-3 text-center">
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs font-mono text-slate-400">
        <span>
          Menampilkan <span className="text-white font-semibold">{filteredIncidents.length}</span> dari{' '}
          <span className="text-white font-semibold">{incidents.length}</span> tiket
        </span>
        <span className="text-[11px] text-slate-500">
          Klik baris untuk membuka slide-over drawer histori & tindakan
        </span>
      </div>
    </div>
  );
};
