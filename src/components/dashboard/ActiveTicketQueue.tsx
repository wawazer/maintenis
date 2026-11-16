import React, { useState, useMemo } from 'react';
import { IncidentReport } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Image as ImageIcon, ChevronRight, AlertCircle, ChevronDown } from 'lucide-react';

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

  const filteredIncidents = useMemo(() => {
    const urgencyRank: Record<string, number> = { Critical: 3, Urgent: 2, Normal: 1 };
    const isClosedRank = (status: string) =>
      status === 'RESOLVED' || status === 'CLOSED' ? 1 : 0;

    return incidents
      .filter((ticket) => {
        if (selectedAssetId && ticket.asset_id !== selectedAssetId) {
          return false;
        }

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

        if (statusFilter !== 'ALL' && ticket.status_terkini !== statusFilter) {
          return false;
        }

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
    <div className="rounded-[12px] border border-[#292a4d] bg-[#0c0a2b] overflow-hidden">
      {/* Pill Tab Filter Bar */}
      <div className="p-3 border-b border-[#292a4d] bg-[#0c0a2b] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[30px] text-xs font-medium border transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#2c2b52] border-[#665eff] text-white'
                  : 'bg-[#13151f] border-[#202333] text-[#b4b4bb] hover:text-white hover:border-[#292a4d]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-[30px] tabular-nums ${
                  activeTab === tab.id
                    ? 'bg-[#0c0a2b] text-white'
                    : 'bg-[#0c0a2b]/60 text-[#9b9ba4]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Status Dropdown Pill & Active Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedShift !== 'ALL' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[30px] bg-[#2c2b52]/60 border border-[#665eff]/70 text-xs text-white font-medium">
              <span>Shift: {selectedShift}</span>
              {onClearShiftFilter && (
                <button
                  onClick={onClearShiftFilter}
                  className="hover:text-[#ff3a63] font-semibold ml-0.5"
                  title="Hapus filter shift"
                >
                  Ã—
                </button>
              )}
            </div>
          )}

          {selectedAssetId && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[30px] bg-[#13151f] border border-[#ff3a63]/70 text-xs text-white font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff3a63]" />
              <span>Aset: {selectedAssetId}</span>
              <button
                onClick={onClearAssetFilter}
                className="hover:text-[#ff3a63] font-semibold ml-0.5"
                title="Hapus filter aset"
              >
                Ã—
              </button>
            </div>
          )}

          <div className="relative tv-hide">
            <select
              aria-label="Filter Status Tiket"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-[#13151f] border border-[#292a4d] hover:border-[#665eff] rounded-[30px] px-3 pr-7 py-1 text-xs font-medium text-[#b4b4bb] hover:text-white focus:outline-none cursor-pointer transition-colors"
            >
              <option value="ALL">Semua Status</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#9b9ba4] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Dense Product Table (Index Style: Carbon Iris rows, Graphite 1px borders, tabular figures) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-[#292a4d] bg-[#0c0a2b] text-[11px] font-medium text-[#9b9ba4] uppercase tracking-[0.015em]">
              <th className="py-2.5 px-3">Ticket ID</th>
              <th className="py-2.5 px-3">Kategori</th>
              <th className="py-2.5 px-3">Aset / Lokasi</th>
              <th className="py-2.5 px-3">Urgensi</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Pelapor</th>
              <th className="py-2.5 px-3">PIC Teknisi</th>
              <th className="py-2.5 px-3 text-right">Durasi / SLA</th>
              <th className="py-2.5 px-3 text-center tv-hide">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#202333]">
            {filteredIncidents.length === 0 ? (
              <tr className="bg-[#13151f]">
                <td colSpan={9} className="py-8 text-center text-[#9b9ba4] text-xs">
                  Tidak ada tiket incident yang cocok dengan filter aktif.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((ticket) => {
                const age = getTicketAgeInfo(ticket);
                return (
                  <tr
                    key={ticket.ticket_id}
                    onClick={() => onSelectTicket(ticket)}
                    className="bg-[#13151f] hover:bg-[#2c2b52]/50 transition-colors cursor-pointer group"
                  >
                    {/* Ticket ID */}
                    <td className="py-2.5 px-3 font-medium text-white tabular-nums whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {ticket.foto_awal_url ? (
                          <ImageIcon className="w-3.5 h-3.5 text-[#0067ff] shrink-0" />
                        ) : null}
                        <span>{ticket.ticket_id}</span>
                      </div>
                    </td>

                    {/* Kategori */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={ticket.kategori_laporan} size="sm" />
                    </td>

                    {/* Aset / Lokasi */}
                    <td className="py-2.5 px-3 max-w-xs">
                      <div className="font-medium text-white tabular-nums">
                        {ticket.asset_id}
                      </div>
                      <div className="text-xs text-[#9b9ba4] truncate">
                        {ticket.lokasi_detail}
                      </div>
                    </td>

                    {/* Urgensi */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={ticket.urgensi} size="sm" />
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={ticket.status_terkini} size="sm" />
                    </td>

                    {/* Pelapor */}
                    <td className="py-2.5 px-3 hidden md:table-cell">
                      <div className="text-white font-medium truncate max-w-[130px]">
                        {ticket.pelapor_nama}
                      </div>
                      <div className="text-[11px] text-[#9b9ba4] truncate max-w-[130px]">
                        {ticket.pelapor_unit}
                      </div>
                    </td>

                    {/* PIC Teknisi */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {ticket.pic_teknisi_nama ? (
                        <span className="text-white font-medium text-xs">
                          {ticket.pic_teknisi_nama}
                        </span>
                      ) : (
                        <span className="text-[#9b9ba4] text-xs">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Waktu & SLA Indicator */}
                    <td className="py-2.5 px-3 text-right text-xs tabular-nums whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          age.isSlaBreach ? 'text-[#ff3a63] font-semibold' : 'text-[#b4b4bb]'
                        }`}
                        title={age.isSlaBreach ? 'Melebihi target SLA 3.0 Jam' : 'Dalam batas SLA'}
                      >
                        {age.isSlaBreach && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                        {age.label}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-2.5 px-3 text-center tv-hide">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(ticket);
                        }}
                        className="p-1 rounded-[30px] text-[#9b9ba4] group-hover:text-white group-hover:bg-[#2c2b52] transition-colors"
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
      <div className="p-3 border-t border-[#292a4d] bg-[#0c0a2b] flex flex-wrap items-center justify-between gap-2 text-xs text-[#9b9ba4] tabular-nums">
        <span>
          Menampilkan <strong className="text-white font-medium">{filteredIncidents.length}</strong> dari{' '}
          <strong className="text-white font-medium">{incidents.length}</strong> tiket
        </span>
        <span className="tv-hide">
          Klik baris untuk membuka detail histori, foto Before/After & tindakan
        </span>
      </div>
    </div>
  );
};
