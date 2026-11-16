import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  AlertTriangle,
  Wrench,
  Sparkles,
  CheckCircle,
  Trash2,
  ChevronDown
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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      {/* Abyss Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#02030b]/85 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Slate Indigo Elevated Modal Card (20px radius, 1px Iris Border, no drop shadow) */}
      <div className="relative z-10 w-full max-w-2xl bg-[#0c0a2b] border border-[#292a4d] rounded-[20px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-[#202333] flex items-center justify-between gap-3 bg-[#0c0a2b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-[#13151f] border border-[#292a4d] flex items-center justify-center text-white shrink-0">
              <Wrench className="w-4 h-4 text-[#ff3a63]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[18px] leading-[1.4] font-display font-semibold tracking-[0.013em] text-white">
                  Lapor Insiden & Temuan Lapangan
                </h2>
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-[30px] bg-[#13151f] text-[#b4b4bb] border border-[#292a4d] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffff00]" />
                  Fast Report &lt; 30s
                </span>
              </div>
              <p className="text-xs text-[#9b9ba4] mt-0.5">
                Pelapor: <span className="text-white font-medium">{user?.nama_lengkap}</span>{' '}
                ({user?.email})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 rounded-[30px] bg-[#13151f] border border-[#202333] text-[#9b9ba4] hover:text-white hover:border-[#292a4d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* 1. Category Selector */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block mb-2 font-medium">
              Kategori Laporan (Pilih Satu)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCategory('KERUSAKAN');
                  if (assetId === 'NON-ASET') setAssetId(assets[0]?.asset_id || '');
                }}
                className={`p-3.5 rounded-[12px] border text-left transition-colors flex items-start gap-3 ${
                  category === 'KERUSAKAN'
                    ? 'bg-[#2c2b52]/60 border-[#ff3a63] text-white'
                    : 'bg-[#13151f] border-[#202333] text-[#b4b4bb] hover:border-[#292a4d]'
                }`}
              >
                <div className="w-8 h-8 rounded-[6px] bg-[#0c0a2b] border border-[#292a4d] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#ff3a63]" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white">
                    Kerusakan Mesin / Fasilitas
                  </div>
                  <p className="text-xs text-[#9b9ba4] mt-0.5 leading-snug">
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
                className={`p-3.5 rounded-[12px] border text-left transition-colors flex items-start gap-3 ${
                  category === 'ALAT_TIDAK_PADA_TEMPATNYA'
                    ? 'bg-[#2c2b52]/60 border-[#665eff] text-white'
                    : 'bg-[#13151f] border-[#202333] text-[#b4b4bb] hover:border-[#292a4d]'
                }`}
              >
                <div className="w-8 h-8 rounded-[6px] bg-[#0c0a2b] border border-[#292a4d] flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4 text-[#665eff]" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white">
                    5R / Alat Tidak Pada Tempatnya
                  </div>
                  <p className="text-xs text-[#9b9ba4] mt-0.5 leading-snug">
                    Peralatan berserakan, halangan jalur evakuasi, atau ketidakrapihan 5R.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Lokasi & Aset */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block mb-1.5 font-medium">
                Lokasi / Area
              </label>
              <div className="relative">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="appearance-none w-full bg-[#13151f] border border-[#292a4d] focus:border-[#665eff] rounded-[30px] px-3.5 pr-8 py-2 text-[13px] text-white focus:outline-none cursor-pointer transition-colors"
                >
                  {PRESET_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#9b9ba4] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block mb-1.5 font-medium">
                Nama Aset / Alat
              </label>
              <div className="relative">
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="appearance-none w-full bg-[#13151f] border border-[#292a4d] focus:border-[#665eff] rounded-[30px] px-3.5 pr-8 py-2 text-[13px] text-white tabular-nums focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="NON-ASET">Umum / Non-Aset (Temuan 5R)</option>
                  {assets.map((ast) => (
                    <option key={ast.asset_id} value={ast.asset_id}>
                      {ast.asset_id} â€” {ast.nama_aset}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#9b9ba4] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block mb-1.5 font-medium">
              Detail Titik Spesifik (Opsional)
            </label>
            <input
              type="text"
              value={customDetail}
              onChange={(e) => setCustomDetail(e.target.value)}
              placeholder="Contoh: Depan Panel 2, Jalur Evakuasi Rak B3, Ruang Kontrol..."
              className="w-full bg-[#13151f] border border-[#292a4d] focus:border-[#665eff] rounded-[30px] px-3.5 py-2 text-[13px] text-white placeholder-[#9b9ba4] focus:outline-none transition-colors"
            />
          </div>

          {/* 3. Tingkat Urgensi */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] font-medium">
                Tingkat Urgensi
              </label>
              <button
                type="button"
                onClick={handleAiAutoClassify}
                disabled={isAiClassifying}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[30px] bg-[#13151f] border border-[#292a4d] hover:border-[#665eff] text-[11px] font-medium text-[#b4b4bb] hover:text-white disabled:opacity-50 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-[#665eff]" />
                <span>{isAiClassifying ? 'Menganalisis...' : 'AI Auto-Classify'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['Normal', 'Urgent', 'Critical'] as UrgencyLevel[]).map((level) => {
                const dotColor =
                  level === 'Critical'
                    ? 'bg-[#ff3a63]'
                    : level === 'Urgent'
                    ? 'bg-[#0067ff]'
                    : 'bg-[#9b9ba4]';

                const activeBorder =
                  level === 'Critical'
                    ? 'border-[#ff3a63] bg-[#2c2b52]/60 text-white'
                    : level === 'Urgent'
                    ? 'border-[#0067ff] bg-[#2c2b52]/60 text-white'
                    : 'border-[#665eff] bg-[#2c2b52]/60 text-white';

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={`py-2 px-3 rounded-[30px] border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      urgency === level
                        ? activeBorder
                        : 'bg-[#13151f] border-[#202333] text-[#b4b4bb] hover:border-[#292a4d] hover:text-white'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Deskripsi Singkat */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block mb-1.5 font-medium">
              Deskripsi Singkat Gejala / Temuan <span className="text-[#ff3a63]">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kondisi alat, suara janggal, bau terbakar, atau kondisi alat berserakan..."
              className="w-full bg-[#13151f] border border-[#292a4d] focus:border-[#665eff] rounded-[12px] p-3 text-[13px] text-white placeholder-[#9b9ba4] focus:outline-none transition-colors"
            />
          </div>

          {/* 5. Foto Bukti Awal */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] block mb-1.5 font-medium">
              Foto Bukti Awal (Kompresi Otomatis Maks 800px)
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
                className="border border-dashed border-[#292a4d] hover:border-[#665eff] bg-[#13151f] hover:bg-[#2c2b52]/30 rounded-[12px] p-4 text-center cursor-pointer transition-colors"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-[30px] bg-[#0c0a2b] border border-[#292a4d] flex items-center justify-center text-white">
                    <Camera className="w-4 h-4 text-[#0067ff]" />
                  </div>
                  <div className="text-[13px] font-medium text-white">
                    {isCompressing ? 'Mengompresi gambar...' : 'Ambil Foto Kamera / Unggah Gambar'}
                  </div>
                  <p className="text-xs text-[#9b9ba4]">
                    Otomatis dikompresi ke JPEG ~100KB untuk upload instan
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-[12px] border border-[#292a4d] bg-[#13151f] p-2.5 flex items-center gap-3">
                <img
                  src={previewUrl}
                  alt="Bukti Awal"
                  className="w-20 h-20 rounded-[6px] object-cover border border-[#202333]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-white text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-[#ffff00] shrink-0" />
                    <span>Terkonversi ke Canvas JPEG</span>
                  </div>
                  {compressionInfo && (
                    <div className="text-xs text-[#9b9ba4] mt-1 space-y-0.5 tabular-nums">
                      <div>Resolusi: {compressionInfo.resolution}</div>
                      <div>
                        Ukuran: <span className="text-white">{formatBytes(compressionInfo.compressedSize)}</span>{' '}
                        <span>(Asli: {formatBytes(compressionInfo.originalSize)})</span>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="p-2 rounded-[30px] bg-[#0c0a2b] border border-[#202333] text-[#ff3a63] hover:border-[#ff3a63]/60 transition-colors"
                  title="Hapus foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Actions: Ghost Cancel + Exclusive Coral Primary CTA */}
          <div className="pt-3.5 border-t border-[#202333] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-[30px] border border-[#353545] bg-[#13151f] text-[13px] font-medium text-[#b4b4bb] hover:text-white hover:border-[#292a4d] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="btn-coral-cta px-5 py-2 text-[13px] disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isSubmitting ? 'Mengirim Laporan...' : 'Kirim Laporan Lapangan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
