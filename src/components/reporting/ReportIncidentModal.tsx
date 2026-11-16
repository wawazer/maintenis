import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  AlertTriangle,
  Wrench,
  Sparkles,
  CheckCircle,
  FileText,
  MapPin,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  TicketCategory,
  UrgencyLevel,
  AssetMaster,
  CreateTicketPayload
} from '../../types';
import { compressImageFile, formatBytes } from '../../utils/imageCompressor';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: AssetMaster[];
  onSubmit: (payload: CreateTicketPayload) => Promise<void>;
}

const PRESET_LOCATIONS = [
  'Power House Area B',
  'Dermaga Barat Bay 4',
  'Gudang Logistik A',
  'Pompa Sentral Unit 1',
  'Rooftop Gedung Utama',
  'Workshop Mekanik & Elektrikal'
];

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSubmit
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<TicketCategory>('KERUSAKAN');
  const [location, setLocation] = useState<string>(PRESET_LOCATIONS[0]);
  const [customDetail, setCustomDetail] = useState<string>('');
  const [assetId, setAssetId] = useState<string>(assets[0]?.asset_id || 'NON-ASET');
  const [urgency, setUrgency] = useState<UrgencyLevel>('Normal');
  const [description, setDescription] = useState<string>('');
  
  // Image Compression State
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: number;
    compressedSize: number;
    resolution: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiClassifying, setIsAiClassifying] = useState(false);

  if (!isOpen) return null;

  // Filter assets by chosen location or show all
  const filteredAssets = assets.filter((a) => a.lokasi_area.includes(location.split(' ')[0]));

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const result = await compressImageFile(file, 800, 0.78);
      setPreviewUrl(result.dataUrl);
      setBase64Image(result.base64);
      setCompressionInfo({
        originalSize: result.originalSizeBytes,
        compressedSize: result.compressedSizeBytes,
        resolution: `${result.width}x${result.height}px`
      });
    } catch (err: any) {
      alert(err.message || 'Gagal memproses gambar.');
    } finally {
      setIsCompressing(false);
    }
  };

  const removePhoto = () => {
    setPreviewUrl(null);
    setBase64Image(null);
    setCompressionInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // AI Auto-Classify Urgency helper
  const handleAiAutoClassify = () => {
    if (!description.trim()) {
      alert('Tuliskan deskripsi gejala atau temuan terlebih dahulu.');
      return;
    }

    setIsAiClassifying(true);
    setTimeout(() => {
      const descLower = description.toLowerCase();
      if (
        descLower.includes('trip') ||
        descLower.includes('mati') ||
        descLower.includes('asap') ||
        descLower.includes('bakar') ||
        descLower.includes('ledakan') ||
        descLower.includes('overheat') ||
        descLower.includes('fatal') ||
        descLower.includes('darurat')
      ) {
        setUrgency('Critical');
      } else if (
        descLower.includes('bocor') ||
        descLower.includes('macet') ||
        descLower.includes('getar') ||
        descLower.includes('bunyi') ||
        descLower.includes('halang') ||
        descLower.includes('rusak')
      ) {
        setUrgency('Urgent');
      } else {
        setUrgency('Normal');
      }
      setIsAiClassifying(false);
    }, 400);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const finalLocation = customDetail
        ? `${location} - ${customDetail}`
        : location;

      await onSubmit({
        kategori_laporan: category,
        asset_id: category === 'ALAT_TIDAK_PADA_TEMPATNYA' && assetId === '' ? 'NON-ASET' : assetId,
        lokasi_detail: finalLocation,
        urgensi: urgency,
        deskripsi: description,
        foto_awal_base64: base64Image || undefined,
        pelapor_unit: user?.unit_kerja
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                  Lapor Insiden & Temuan Lapangan
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  &lt; 30s Fast Report
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pelapor: <span className="text-slate-200 font-medium">{user?.nama_lengkap}</span>{' '}
                ({user?.email})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* 1. Category Selector: Large Tactile Cards */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2 font-medium">
              Kategori Laporan (Pilih Satu):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCategory('KERUSAKAN');
                  if (assetId === 'NON-ASET') setAssetId(assets[0]?.asset_id || '');
                }}
                className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                  category === 'KERUSAKAN'
                    ? 'bg-rose-950/40 border-rose-600 text-white shadow-md'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded shrink-0 ${
                    category === 'KERUSAKAN'
                      ? 'bg-rose-900/60 text-rose-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold font-mono uppercase tracking-wide">
                    Kerusakan Mesin / Fasilitas
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Kerusakan fisik, trip listrik, kebocoran, atau abnormalitas mesin.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('ALAT_TIDAK_PADA_TEMPATNYA');
                  setAssetId('NON-ASET');
                }}
                className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                  category === 'ALAT_TIDAK_PADA_TEMPATNYA'
                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-md'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded shrink-0 ${
                    category === 'ALAT_TIDAK_PADA_TEMPATNYA'
                      ? 'bg-amber-900/60 text-amber-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold font-mono uppercase tracking-wide">
                    5R / Alat Tidak Pada Tempatnya
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Peralatan berserakan, halangan jalur evakuasi, atau ketidakrapihan 5R.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Lokasi & Aset */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
                Lokasi / Area:
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700"
              >
                {PRESET_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
                Nama Aset / Alat:
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-slate-700"
              >
                <option value="NON-ASET">Umum / Non-Aset (Temuan 5R)</option>
                {assets.map((ast) => (
                  <option key={ast.asset_id} value={ast.asset_id}>
                    {ast.asset_id} — {ast.nama_aset}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Detail Titik Spesifik (Opsional):
            </label>
            <input
              type="text"
              value={customDetail}
              onChange={(e) => setCustomDetail(e.target.value)}
              placeholder="Contoh: Depan Panel 2, Jalur Evakuasi Rak B3, Ruang Kontrol..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
            />
          </div>

          {/* 3. Tingkat Urgensi */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-medium">
                Tingkat Urgensi:
              </label>
              <button
                type="button"
                onClick={handleAiAutoClassify}
                disabled={isAiClassifying}
                className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                <span>AI Auto-Classify Urgency</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['Normal', 'Urgent', 'Critical'] as UrgencyLevel[]).map((level) => {
                const styles = {
                  Normal:
                    urgency === 'Normal'
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400',
                  Urgent:
                    urgency === 'Urgent'
                      ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400',
                  Critical:
                    urgency === 'Critical'
                      ? 'bg-rose-950/60 border-rose-600 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                };

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={`py-2 px-3 rounded-lg border font-mono text-xs uppercase font-semibold transition-all ${styles[level]}`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Deskripsi Singkat */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Deskripsi Singkat Gejala / Temuan: <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kondisi alat, suara janggal, bau terbakar, atau kondisi alat berserakan..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
            />
          </div>

          {/* 5. Foto Bukti Awal (Client-Side Compression) */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Foto Bukti Awal (Kompresi Otomatis Maks 800px):
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-lg p-4 text-center cursor-pointer transition-colors"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="p-2 rounded-full bg-slate-800 text-slate-300">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    Ambil Foto Kamera / Unggah Gambar
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Otomatis dikompresi ke JPEG ~100KB untuk upload instan
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-lg border border-slate-800 bg-slate-950 p-2 flex items-center gap-3">
                <img
                  src={previewUrl}
                  alt="Bukti Awal"
                  className="w-20 h-20 rounded object-cover border border-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Terkonversi ke Canvas JPEG</span>
                  </div>
                  {compressionInfo && (
                    <div className="text-[11px] font-mono text-slate-400 mt-1 space-y-0.5">
                      <div>Resolusi: {compressionInfo.resolution}</div>
                      <div>
                        Ukuran: {formatBytes(compressionInfo.compressedSize)}{' '}
                        <span className="text-slate-500">
                          (Asli: {formatBytes(compressionInfo.originalSize)})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="p-1.5 rounded text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Hapus foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-mono font-bold text-white transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md"
            >
              {isSubmitting ? 'Mengirim Laporan...' : 'Kirim Laporan Lapangan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
