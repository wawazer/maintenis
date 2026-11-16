import React, { useState, useRef } from 'react';
import {
  X,
  ExternalLink,
  FileCheck,
  Camera,
  UserCheck,
  ChevronDown
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

  const [previewResolvedPhoto, setPreviewResolvedPhoto] = useState<string | null>(null);
  const [resolvedBase64, setResolvedBase64] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
      {/* Abyss Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#02030b]/85 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-over Slate Indigo Panel */}
      <div className="relative z-10 w-full sm:w-[600px] lg:w-[680px] bg-[#0c0a2b] border-l border-[#292a4d] flex flex-col animate-in slide-in-from-right duration-200 h-full">
        {/* Drawer Header */}
        <div className="p-4 sm:px-6 border-b border-[#202333] flex items-center justify-between gap-3 bg-[#0c0a2b]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[18px] font-display font-semibold tracking-[0.013em] text-white tabular-nums">
                {ticket.ticket_id}
              </span>
              <StatusBadge status={ticket.kategori_laporan} size="sm" showDot={false} />
              <StatusBadge status={ticket.status_terkini} size="sm" />
            </div>
            <p className="text-xs text-[#9b9ba4] mt-0.5 tabular-nums">
              Dibuat pada {new Date(ticket.created_at).toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {showQuickClaim && (
              <button
                type="button"
                onClick={handleQuickClaim}
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[30px] bg-[#13151f] border border-[#0067ff]/80 hover:bg-[#2c2b52]/60 text-white text-xs font-medium transition-colors disabled:opacity-50"
                title="Ambil tiket ini dan mulai kerjakan sekarang"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#0067ff]" />
                <span>Ambil Tiket</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Tutup drawer"
              className="p-1.5 rounded-[30px] bg-[#13151f] border border-[#202333] text-[#9b9ba4] hover:text-white hover:border-[#292a4d] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 1. Before & After Photo Comparison */}
          <div className="rounded-[12px] border border-[#202333] bg-[#13151f] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-display font-semibold tracking-[0.013em] text-white">
                Dokumentasi Foto: Before & After
              </h4>
              <span className="text-[11px] text-[#9b9ba4]">
                Verifikasi Visual Lapangan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Foto Awal (Before) */}
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#b4b4bb] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff3a63]" />
                  Kondisi Temuan (Before)
                </span>
                {ticket.foto_awal_url ? (
                  <div className="relative group rounded-[12px] border border-[#292a4d] overflow-hidden bg-[#0c0a2b] aspect-video flex items-center justify-center">
                    <img
                      src={ticket.foto_awal_url}
                      alt="Foto Awal"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <a
                      href={ticket.foto_awal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 p-1.5 rounded-[30px] bg-[#02030b]/80 border border-[#292a4d] text-white hover:bg-[#2c2b52] transition-colors"
                      title="Buka Ukuran Penuh"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="rounded-[12px] border border-dashed border-[#292a4d] aspect-video flex items-center justify-center text-xs text-[#9b9ba4] bg-[#0c0a2b]/60">
                    Tidak ada foto temuan
                  </div>
                )}
              </div>

              {/* Foto Akhir (After) */}
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#b4b4bb] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffff00]" />
                  Hasil Perbaikan (After)
                </span>
                {ticket.foto_akhir_url || previewResolvedPhoto ? (
                  <div className="relative group rounded-[12px] border border-[#292a4d] overflow-hidden bg-[#0c0a2b] aspect-video flex items-center justify-center">
                    <img
                      src={previewResolvedPhoto || ticket.foto_akhir_url}
                      alt="Foto Akhir"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <a
                      href={previewResolvedPhoto || ticket.foto_akhir_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 p-1.5 rounded-[30px] bg-[#02030b]/80 border border-[#292a4d] text-white hover:bg-[#2c2b52] transition-colors"
                      title="Buka Ukuran Penuh"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="rounded-[12px] border border-dashed border-[#292a4d] aspect-video flex items-center justify-center text-xs text-[#9b9ba4] bg-[#0c0a2b]/60">
                    Menunggu penanganan selesai
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Key Metadata & Description */}
          <div className="grid grid-cols-2 gap-3.5 text-xs bg-[#13151f] p-4 rounded-[12px] border border-[#202333]">
            <div>
              <span className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block">
                Aset Terkait
              </span>
              <button
                onClick={() => {
                  if (ticket.asset_id && ticket.asset_id !== 'NON-ASET' && onFilterByAsset) {
                    onFilterByAsset(ticket.asset_id);
                    onClose();
                  }
                }}
                className="text-[13px] font-medium text-white hover:text-[#0067ff] flex items-center gap-1.5 mt-1 tabular-nums transition-colors"
              >
                <span>{ticket.asset_id}</span>
                {ticket.asset_id !== 'NON-ASET' && (
                  <span className="text-[11px] px-2 py-0.5 rounded-[30px] bg-[#0c0a2b] border border-[#292a4d] text-[#b4b4bb]">
                    Filter Aset
                  </span>
                )}
              </button>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block">
                Tingkat Urgensi
              </span>
              <div className="mt-1">
                <StatusBadge status={ticket.urgensi} size="sm" />
              </div>
            </div>

            <div className="col-span-2">
              <span className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block">
                Lokasi Titik
              </span>
              <p className="text-[13px] text-white mt-0.5">{ticket.lokasi_detail}</p>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block">
                Pelapor
              </span>
              <p className="text-[13px] text-white mt-0.5 font-medium">
                {ticket.pelapor_nama}{' '}
                <span className="text-xs text-[#9b9ba4] font-normal">
                  ({ticket.pelapor_unit})
                </span>
              </p>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block">
                PIC Teknisi
              </span>
              <p className="text-[13px] text-white mt-0.5 font-medium">
                {ticket.pic_teknisi_nama || (
                  <span className="text-[#9b9ba4] font-normal">Belum Ditugaskan</span>
                )}
              </p>
            </div>
          </div>

          {/* Description Box */}
          <div className="rounded-[12px] border border-[#202333] bg-[#13151f] p-4">
            <span className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block mb-1.5 font-medium">
              Deskripsi Gejala / Temuan Lapangan
            </span>
            <p className="text-[13px] text-white leading-[1.6]">
              {ticket.deskripsi}
            </p>
          </div>

          {/* 3. AI Troubleshooting Assistant Card */}
          <RoleGuard permission="ACCESS_AI_ANALYST">
            <AiTroubleshootCard ticket={ticket} />
          </RoleGuard>

          {/* 4. Role-Gated Action Panel */}
          <RoleGuard
            permission="UPDATE_TICKET_PROGRESS"
            fallback={
              <div className="p-3.5 rounded-[12px] border border-[#202333] bg-[#13151f] text-xs text-[#9b9ba4] text-center">
                Role Pelapor: Anda dapat memantau proses perbaikan melalui timeline di bawah.
              </div>
            }
          >
            <div className="rounded-[12px] border border-[#292a4d] bg-[#13151f] p-4 space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-[#202333]">
                <FileCheck className="w-4 h-4 text-[#0067ff]" />
                <h4 className="text-[14px] font-display font-semibold tracking-[0.013em] text-white">
                  Panel Tindakan Teknisi & Supervisor
                </h4>
              </div>

              <form onSubmit={handleActionSubmit} className="space-y-3.5">
                {/* Transition Status Pills */}
                <div>
                  <label className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block mb-1.5 font-medium">
                    Ubah Status Tiket
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {availableStatuses.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStatus(st)}
                        className={`py-1.5 px-2.5 rounded-[30px] text-xs font-medium border transition-colors ${
                          selectedStatus === st
                            ? 'bg-[#2c2b52] border-[#665eff] text-white'
                            : 'bg-[#0c0a2b] border-[#202333] text-[#b4b4bb] hover:border-[#292a4d] hover:text-white'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assign PIC */}
                <RoleGuard permission="ASSIGN_TECHNICIAN">
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block mb-1.5 font-medium">
                      Tugaskan PIC Teknisi
                    </label>
                    <div className="relative">
                      <select
                        value={selectedPicEmail}
                        onChange={(e) => setSelectedPicEmail(e.target.value)}
                        className="appearance-none w-full bg-[#0c0a2b] border border-[#292a4d] focus:border-[#665eff] rounded-[30px] px-3.5 pr-8 py-2 text-[13px] text-white focus:outline-none cursor-pointer transition-colors"
                      >
                        <option value="">-- Pilih Teknisi --</option>
                        {technicians.map((tech) => (
                          <option key={tech.email} value={tech.email}>
                            {tech.nama_lengkap} ({tech.spesialisasi || 'Teknisi'} â€¢{' '}
                            {tech.shift || 'Shift 1'})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-[#9b9ba4] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </RoleGuard>

                {/* Upload Foto Hasil Perbaikan */}
                <div>
                  <label className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block mb-1.5 font-medium">
                    Unggah Foto Hasil Perbaikan / Penertiban (After)
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
                    className="flex items-center gap-2 px-4 py-2 rounded-[30px] bg-[#0c0a2b] border border-[#292a4d] hover:border-[#665eff] text-xs font-medium text-[#b4b4bb] hover:text-white transition-colors w-full justify-center"
                  >
                    <Camera className="w-4 h-4 text-[#0067ff]" />
                    <span>
                      {previewResolvedPhoto
                        ? 'Ganti Foto Hasil Perbaikan'
                        : 'Ambil Foto / Pilih File (Max 800px)'}
                    </span>
                  </button>
                </div>

                {/* Catatan Penyelesaian */}
                <div>
                  <label className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block mb-1.5 font-medium">
                    Catatan Tindakan / Penyelesaian Teknis
                    {selectedStatus === 'RESOLVED' && (
                      <span className="text-[#ff3a63] ml-1">*</span>
                    )}
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Jelaskan komponen yang diganti, isolasi sumber masalah, atau letak pengembalian alat 5R..."
                    className="w-full bg-[#0c0a2b] border border-[#292a4d] focus:border-[#665eff] rounded-[12px] p-2.5 text-[13px] text-white placeholder-[#9b9ba4] focus:outline-none transition-colors"
                  />
                </div>

                {/* Log Note */}
                <div>
                  <label className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block mb-1.5 font-medium">
                    Catatan Entri Log Audit
                  </label>
                  <input
                    type="text"
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="Ringkasan pembaruan status untuk riwayat audit..."
                    className="w-full bg-[#0c0a2b] border border-[#292a4d] focus:border-[#665eff] rounded-[30px] px-3.5 py-2 text-[13px] text-white placeholder-[#9b9ba4] focus:outline-none transition-colors"
                  />
                </div>

                {validationError && (
                  <div className="p-3 rounded-[12px] bg-[#0c0a2b] border border-[#ff3a63]/70 text-xs text-[#ff3a63]">
                    {validationError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn-coral-cta w-full py-2.5 text-[13px] disabled:opacity-50"
                >
                  {isUpdating ? 'Menyimpan Perubahan...' : 'Simpan Pembaruan Tiket'}
                </button>
              </form>
            </div>
          </RoleGuard>

          {/* 5. Chronological Audit Trail Timeline */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-display font-semibold tracking-[0.013em] text-white">
                Audit Trail & Riwayat Siklus Tiket
              </h4>
              <span className="text-xs text-[#9b9ba4] tabular-nums">
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
