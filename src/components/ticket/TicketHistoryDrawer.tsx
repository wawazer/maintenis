import React, { useState, useRef } from 'react';
import {
  X,
  ExternalLink,
  FileCheck,
  Camera,
  UserCheck
} from 'lucide-react';
import {
  IncidentReport,
  TicketHistoryLog,
  UserProfile,
  TicketStatus,
  UpdateTicketPayload
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { RoleGuard } from '../common/RoleGuard';
import { TicketTimeline } from './TicketTimeline';
import { AiTroubleshootCard } from '../ai/AiTroubleshootCard';
import { useAuth } from '../../context/AuthContext';
import { compressImageFile } from '../../utils/imageCompressor';

interface TicketHistoryDrawerProps {
  ticket: IncidentReport | null;
  logs: TicketHistoryLog[];
  technicians: UserProfile[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateTicket: (payload: UpdateTicketPayload) => Promise<void>;
  onFilterByAsset?: (assetId: string) => void;
}

export const TicketHistoryDrawer: React.FC<TicketHistoryDrawerProps> = ({
  ticket,
  logs,
  technicians,
  isOpen,
  onClose,
  onUpdateTicket,
  onFilterByAsset
}) => {
  const { user, can } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Ticket Mutations
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(
    ticket?.status_terkini || 'IN_PROGRESS'
  );
  const [selectedPicEmail, setSelectedPicEmail] = useState<string>(
    ticket?.pic_teknisi_email || ''
  );
  const [resolutionNotes, setResolutionNotes] = useState<string>(
    ticket?.catatan_penyelesaian || ''
  );
  const [logNotes, setLogNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Resolution Photo Upload
  const [previewResolvedPhoto, setPreviewResolvedPhoto] = useState<string | null>(null);
  const [resolvedBase64, setResolvedBase64] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update local state when ticket changes
  React.useEffect(() => {
    if (ticket) {
      setSelectedStatus(ticket.status_terkini);
      setSelectedPicEmail(ticket.pic_teknisi_email || '');
      setResolutionNotes(ticket.catatan_penyelesaian || '');
      setLogNotes('');
      setValidationError(null);
      setPreviewResolvedPhoto(null);
      setResolvedBase64(null);
    }
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  // Filter logs for this specific ticket
  const ticketLogs = logs.filter((l) => l.ticket_id === ticket.ticket_id);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await compressImageFile(file, 800, 0.78);
      setPreviewResolvedPhoto(result.dataUrl);
      setResolvedBase64(result.base64);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses foto hasil perbaikan.');
    }
  };

  // 1-Click Quick Claim for Technician / Supervisor
  const handleQuickClaim = async () => {
    if (!user || isUpdating) return;
    setIsUpdating(true);
    setValidationError(null);
    try {
      await onUpdateTicket({
        ticket_id: ticket.ticket_id,
        status_terkini: 'IN_PROGRESS',
        pic_teknisi_email: user.email,
        pic_teknisi_nama: user.nama_lengkap,
        catatan_log: `Tiket diambil (Claim) dan mulai ditangani oleh ${user.nama_lengkap}.`
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (selectedStatus === 'RESOLVED' && !resolutionNotes.trim()) {
      setValidationError('Catatan tindakan/penyelesaian wajib diisi sebelum menandai RESOLVED.');
      return;
    }

    setIsUpdating(true);
    try {
      const picTech = technicians.find((t) => t.email === selectedPicEmail);

      await onUpdateTicket({
        ticket_id: ticket.ticket_id,
        status_terkini: selectedStatus,
        pic_teknisi_email: selectedPicEmail || undefined,
        pic_teknisi_nama: picTech?.nama_lengkap || ticket.pic_teknisi_nama || undefined,
        catatan_penyelesaian: resolutionNotes || undefined,
        catatan_log:
          logNotes.trim() ||
          `Status diubah menjadi ${selectedStatus} oleh ${user?.nama_lengkap}`,
        foto_akhir_base64: resolvedBase64 || undefined
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const availableStatuses: TicketStatus[] = [
    'SUBMITTED',
    'ASSIGNED',
    'IN_PROGRESS',
    'ON_HOLD',
    'RESOLVED',
    'CLOSED'
  ].filter((st) => (st === 'CLOSED' ? can('CLOSE_TICKET') : true)) as TicketStatus[];

  const showQuickClaim =
    can('CLAIM_TICKET') &&
    (ticket.status_terkini === 'SUBMITTED' || ticket.status_terkini === 'ASSIGNED') &&
    ticket.pic_teknisi_email?.toLowerCase() !== user?.email.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-over Panel */}
      <div className="relative z-10 w-full sm:w-[600px] lg:w-[680px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 h-full">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/90">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold font-mono text-white tabular-nums tracking-wider">
                {ticket.ticket_id}
              </span>
              <StatusBadge status={ticket.kategori_laporan} size="sm" showDot={false} />
              <StatusBadge status={ticket.status_terkini} size="sm" />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Dibuat pada {new Date(ticket.created_at).toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {showQuickClaim && (
              <button
                type="button"
                onClick={handleQuickClaim}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold transition-colors disabled:opacity-50"
                title="Ambil tiket ini dan mulai kerjakan sekarang"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Ambil Tiket</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Tutup drawer"
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Before & After Photo Comparison */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Dokumentasi Foto: Before & After
              </h4>
              <span className="text-[10px] font-mono text-slate-500">
                Verifikasi Visual Lapangan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Foto Awal (Before) */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-rose-400 uppercase font-semibold block">
                  â€¢ Kondisi Temuan (Before)
                </span>
                {ticket.foto_awal_url ? (
                  <div className="relative group rounded border border-slate-800 overflow-hidden bg-slate-900 aspect-video flex items-center justify-center">
                    <img
                      src={ticket.foto_awal_url}
                      alt="Foto Awal"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <a
                      href={ticket.foto_awal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 p-1 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"
                      title="Buka Ukuran Penuh"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-slate-800 aspect-video flex items-center justify-center text-xs font-mono text-slate-600 bg-slate-900/40">
                    Tidak ada foto temuan
                  </div>
                )}
              </div>

              {/* Foto Akhir (After) */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-emerald-400 uppercase font-semibold block">
                  â€¢ Hasil Perbaikan (After)
                </span>
                {ticket.foto_akhir_url || previewResolvedPhoto ? (
                  <div className="relative group rounded border border-slate-800 overflow-hidden bg-slate-900 aspect-video flex items-center justify-center">
                    <img
                      src={previewResolvedPhoto || ticket.foto_akhir_url}
                      alt="Foto Akhir"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <a
                      href={previewResolvedPhoto || ticket.foto_akhir_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 p-1 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"
                      title="Buka Ukuran Penuh"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-slate-800 aspect-video flex items-center justify-center text-xs font-mono text-slate-600 bg-slate-900/40">
                    Menunggu penanganan selesai
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Key Metadata & Description */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">
                Aset Terkait:
              </span>
              <button
                onClick={() => {
                  if (ticket.asset_id && ticket.asset_id !== 'NON-ASET' && onFilterByAsset) {
                    onFilterByAsset(ticket.asset_id);
                    onClose();
                  }
                }}
                className="text-xs font-mono font-bold text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
              >
                <span>{ticket.asset_id}</span>
                {ticket.asset_id !== 'NON-ASET' && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                    Riwayat Mesin
                  </span>
                )}
              </button>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">
                Tingkat Urgensi:
              </span>
              <div className="mt-0.5">
                <StatusBadge status={ticket.urgensi} size="sm" />
              </div>
            </div>

            <div className="col-span-2">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">
                Lokasi Titik:
              </span>
              <p className="text-slate-200 mt-0.5 font-sans">{ticket.lokasi_detail}</p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">
                Pelapor:
              </span>
              <p className="text-slate-200 mt-0.5 font-medium">
                {ticket.pelapor_nama}{' '}
                <span className="text-[11px] font-mono text-slate-500">
                  ({ticket.pelapor_unit})
                </span>
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">
                PIC Teknisi:
              </span>
              <p className="text-slate-200 mt-0.5 font-medium">
                {ticket.pic_teknisi_nama || (
                  <span className="text-slate-500 font-mono italic">Belum Ditugaskan</span>
                )}
              </p>
            </div>
          </div>

          {/* Description Box */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Deskripsi Gejala / Temuan Lapangan:
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {ticket.deskripsi}
            </p>
          </div>

          {/* 3. AI Troubleshooting Assistant Card (for TEKNISI / SUPERVISOR / ADMIN) */}
          <RoleGuard permission="ACCESS_AI_ANALYST">
            <AiTroubleshootCard ticket={ticket} />
          </RoleGuard>

          {/* 4. Role-Gated Action Panel */}
          <RoleGuard
            permission="UPDATE_TICKET_PROGRESS"
            fallback={
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/30 text-xs text-slate-500 font-mono text-center">
                Role Pelapor: Anda dapat memantau proses perbaikan melalui timeline di bawah.
              </div>
            }
          >
            <div className="rounded-lg border border-emerald-900/40 bg-slate-950/90 p-4 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                  Panel Tindakan Teknisi & Supervisor
                </h4>
              </div>

              <form onSubmit={handleActionSubmit} className="space-y-3.5">
                {/* Transition Status */}
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Ubah Status Tiket:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {availableStatuses.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStatus(st)}
                        className={`py-1.5 px-2 rounded text-[11px] font-mono font-semibold border transition-colors ${
                          selectedStatus === st
                            ? 'bg-slate-800 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assign PIC (Supervisor / Admin only) */}
                <RoleGuard permission="ASSIGN_TECHNICIAN">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Tugaskan PIC Teknisi:
                    </label>
                    <select
                      value={selectedPicEmail}
                      onChange={(e) => setSelectedPicEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-700"
                    >
                      <option value="">-- Pilih Teknisi --</option>
                      {technicians.map((tech) => (
                        <option key={tech.email} value={tech.email}>
                          {tech.nama_lengkap} ({tech.spesialisasi || 'Teknisi'} -{' '}
                          {tech.shift || 'Shift 1'})
                        </option>
                      ))}
                    </select>
                  </div>
                </RoleGuard>

                {/* Upload Foto Hasil Perbaikan */}
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Unggah Foto Hasil Perbaikan / Penertiban (After):
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors w-full justify-center"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>
                      {previewResolvedPhoto
                        ? 'Ganti Foto Hasil Perbaikan'
                        : 'Ambil Foto / Pilih File (Max 800px)'}
                    </span>
                  </button>
                </div>

                {/* Catatan Penyelesaian */}
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Catatan Tindakan / Penyelesaian Teknis:
                    {selectedStatus === 'RESOLVED' && (
                      <span className="text-rose-400 ml-1">*</span>
                    )}
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Jelaskan komponen yang diganti, isolasi sumber masalah, atau letak pengembalian alat 5R..."
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                  />
                </div>

                {/* Log Note */}
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Catatan Entri Log Audit:
                  </label>
                  <input
                    type="text"
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="Ringkasan pembaruan status untuk riwayat audit..."
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                  />
                </div>

                {validationError && (
                  <div className="p-2.5 rounded bg-rose-950/50 border border-rose-700/60 text-xs font-mono text-rose-300">
                    {validationError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 font-mono font-bold text-xs text-white transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Menyimpan Perubahan...' : 'Simpan Pembaruan Tiket'}
                </button>
              </form>
            </div>
          </RoleGuard>

          {/* 5. Chronological Audit Trail Timeline */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Audit Trail & Riwayat Siklus Tiket
              </h4>
              <span className="text-[10px] font-mono text-slate-500">
                {ticketLogs.length} Log Tercatat
              </span>
            </div>

            <TicketTimeline logs={ticketLogs} />
          </div>
        </div>
      </div>
    </div>
  );
};
