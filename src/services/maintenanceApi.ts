/**
 * MAINTENIS - Maintenance & Engineering API Adapter
 * 
 * Agnostic backend service adapter implementing:
 * - Google Apps Script Web App endpoints
 * - Automatic id_token injection from Google SSO
 * - Seamless zero-config Offline Mock Mode with LocalStorage persistence
 * - Full AI inference proxy (Gemini 2.5 Flash / Groq Llama 3.3)
 */

import {
  DashboardTelemetryData,
  AiTelemetryBriefing,
  AiCopilotResponse,
  AiTroubleshootResult,
  CreateTicketPayload,
  UpdateTicketPayload,
  IncidentReport,
  TicketHistoryLog,
  UserProfile,
  AssetMaster,
  UserRole
} from '../types';

// Read API URL from Vite environment variable
const GAS_API_URL = import.meta.env.VITE_GAS_API_URL || '';

// LocalStorage Keys for Mock Persistence
const STORAGE_KEYS = {
  ASSETS: 'maintenis_mock_assets_v1',
  INCIDENTS: 'maintenis_mock_incidents_v1',
  LOGS: 'maintenis_mock_logs_v1',
  USERS: 'maintenis_mock_users_v1'
};

// ============================================================================
// DEFAULT SEED DATA (Used when first booting in Mock Mode)
// ============================================================================
const DEFAULT_USERS: UserProfile[] = [
  {
    user_id: 'USR-20260301-001',
    email: 'budi.santoso@perusahaan.com',
    nama_lengkap: 'Budi Santoso',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    unit_kerja: 'Divisi Operasional & Lapangan',
    role: 'PELAPOR',
    spesialisasi: 'Operator Crane',
    shift: 'Shift 1 (Pagi)',
    status_aktif: 'Aktif',
    last_login: new Date().toISOString()
  },
  {
    user_id: 'USR-20260301-002',
    email: 'ahmad.fauzi@perusahaan.com',
    nama_lengkap: 'Ahmad Fauzi',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    unit_kerja: 'Maintenance & Engineering',
    role: 'TEKNISI',
    spesialisasi: 'Mekanik & Hidrolik',
    shift: 'Shift 1 (Pagi)',
    status_aktif: 'Aktif',
    last_login: new Date().toISOString()
  },
  {
    user_id: 'USR-20260301-003',
    email: 'hendra.gunawan@perusahaan.com',
    nama_lengkap: 'Hendra Gunawan',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    unit_kerja: 'Maintenance & Engineering',
    role: 'TEKNISI',
    spesialisasi: 'Listrik, PLC & Instrumentasi',
    shift: 'Shift 2 (Sore)',
    status_aktif: 'Aktif',
    last_login: new Date().toISOString()
  },
  {
    user_id: 'USR-20260301-004',
    email: 'irfan.prasetyo@perusahaan.com',
    nama_lengkap: 'Irfan Prasetyo, S.T.',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    unit_kerja: 'Maintenance & Engineering',
    role: 'SUPERVISOR',
    spesialisasi: 'Lead Reliability Engineer',
    shift: 'Normal Day',
    status_aktif: 'Aktif',
    last_login: new Date().toISOString()
  },
  {
    user_id: 'USR-20260301-005',
    email: 'admin.eng@perusahaan.com',
    nama_lengkap: 'System Administrator',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    unit_kerja: 'IT & CMMS Systems',
    role: 'ADMIN',
    spesialisasi: 'Database & Systems Admin',
    shift: 'Normal Day',
    status_aktif: 'Aktif',
    last_login: new Date().toISOString()
  }
];

const DEFAULT_ASSETS: AssetMaster[] = [
  {
    asset_id: 'GENSET-01',
    nama_aset: 'Diesel Generator Backup 1000kVA',
    kategori: 'Electrical Power',
    lokasi_area: 'Power House Area B',
    status_operasional: 'Breakdown',
    kritikalitas: 'High',
    last_updated: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    asset_id: 'CRANE-QC-03',
    nama_aset: 'Quayside Container Crane 03',
    kategori: 'Heavy Mechanical',
    lokasi_area: 'Dermaga Barat Bay 4',
    status_operasional: 'Maintenance',
    kritikalitas: 'High',
    last_updated: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    asset_id: 'PUMP-CW-02',
    nama_aset: 'Cooling Water Circulation Pump 2',
    kategori: 'Fluid Machinery',
    lokasi_area: 'Pompa Sentral Unit 1',
    status_operasional: 'Ready',
    kritikalitas: 'Medium',
    last_updated: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    asset_id: 'COMP-AIR-01',
    nama_aset: 'Rotary Screw Air Compressor',
    kategori: 'Pneumatics Utility',
    lokasi_area: 'Gudang Kompresor',
    status_operasional: 'Ready',
    kritikalitas: 'Medium',
    last_updated: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    asset_id: 'FORKLIFT-04',
    nama_aset: 'Electric Reach Truck Forklift 5T',
    kategori: 'Mobile Logistics',
    lokasi_area: 'Gudang Logistik A',
    status_operasional: 'Ready',
    kritikalitas: 'Low',
    last_updated: new Date(Date.now() - 3600000 * 72).toISOString()
  },
  {
    asset_id: 'HVAC-CHILLER-01',
    nama_aset: 'Industrial Chiller System 150TR',
    kategori: 'HVAC Facility',
    lokasi_area: 'Rooftop Gedung Utama',
    status_operasional: 'Ready',
    kritikalitas: 'High',
    last_updated: new Date(Date.now() - 3600000 * 96).toISOString()
  }
];

const DEFAULT_INCIDENTS: IncidentReport[] = [
  {
    ticket_id: 'TKT-20260301-001',
    created_at: new Date(Date.now() - 3600000 * 4.5).toISOString(),
    kategori_laporan: 'KERUSAKAN',
    asset_id: 'GENSET-01',
    lokasi_detail: 'Power House Area B - Ruang Mesin Utama',
    urgensi: 'Critical',
    deskripsi: 'Alarm high lube oil temperature terpicu saat running test mingguan. Mesin auto trip setelah 8 menit operasi.',
    foto_awal_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    pelapor_email: 'budi.santoso@perusahaan.com',
    pelapor_nama: 'Budi Santoso',
    pelapor_unit: 'Divisi Operasional & Lapangan',
    status_terkini: 'IN_PROGRESS',
    pic_teknisi_email: 'hendra.gunawan@perusahaan.com',
    pic_teknisi_nama: 'Hendra Gunawan',
    foto_akhir_url: '',
    catatan_penyelesaian: '',
    resolved_at: ''
  },
  {
    ticket_id: 'TKT-20260301-002',
    created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
    kategori_laporan: 'ALAT_TIDAK_PADA_TEMPATNYA',
    asset_id: 'NON-ASET',
    lokasi_detail: 'Gudang Logistik A - Koridor Utama Rak B3',
    urgensi: 'Urgent',
    deskripsi: '2 unit tangga perancah lipat dan toolbox heavy-duty tertinggal di tengah jalur lintasan forklift tanpa barikade.',
    foto_awal_url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80',
    pelapor_email: 'budi.santoso@perusahaan.com',
    pelapor_nama: 'Budi Santoso',
    pelapor_unit: 'Divisi Operasional & Lapangan',
    status_terkini: 'RESOLVED',
    pic_teknisi_email: 'ahmad.fauzi@perusahaan.com',
    pic_teknisi_nama: 'Ahmad Fauzi',
    foto_akhir_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
    catatan_penyelesaian: 'Tangga dan peralatan kerja telah dirapikan ke Tool Crib 5R. Jalur forklift steril dan siap dilalui.',
    resolved_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    ticket_id: 'TKT-20260301-003',
    created_at: new Date(Date.now() - 3600000 * 11).toISOString(),
    kategori_laporan: 'KERUSAKAN',
    asset_id: 'CRANE-QC-03',
    lokasi_detail: 'Dermaga Barat Bay 4 - Boom Hoist',
    urgensi: 'Urgent',
    deskripsi: 'Suara gesekan abnormal dan getaran berlebih pada bearing motor hoist utama ketika mengangkat beban kontainer > 20 ton.',
    foto_awal_url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&auto=format&fit=crop&q=80',
    pelapor_email: 'budi.santoso@perusahaan.com',
    pelapor_nama: 'Budi Santoso',
    pelapor_unit: 'Divisi Operasional & Lapangan',
    status_terkini: 'ASSIGNED',
    pic_teknisi_email: 'ahmad.fauzi@perusahaan.com',
    pic_teknisi_nama: 'Ahmad Fauzi',
    foto_akhir_url: '',
    catatan_penyelesaian: '',
    resolved_at: ''
  },
  {
    ticket_id: 'TKT-20260301-004',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    kategori_laporan: 'ALAT_TIDAK_PADA_TEMPATNYA',
    asset_id: 'NON-ASET',
    lokasi_detail: 'Pompa Sentral Unit 1 - Area Drainase',
    urgensi: 'Normal',
    deskripsi: 'Selang kompresor udara pneumatic dibiarkan melintang di lantai basah tanpa digulung kembali ke spool reel.',
    foto_awal_url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=800&auto=format&fit=crop&q=80',
    pelapor_email: 'budi.santoso@perusahaan.com',
    pelapor_nama: 'Budi Santoso',
    pelapor_unit: 'Divisi Operasional & Lapangan',
    status_terkini: 'SUBMITTED',
    pic_teknisi_email: '',
    pic_teknisi_nama: '',
    foto_akhir_url: '',
    catatan_penyelesaian: '',
    resolved_at: ''
  }
];

const DEFAULT_LOGS: TicketHistoryLog[] = [
  {
    log_id: 'LOG-001',
    ticket_id: 'TKT-20260301-001',
    timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString(),
    status_sebelum: 'NONE',
    status_sesudah: 'SUBMITTED',
    aktor_email: 'budi.santoso@perusahaan.com',
    aktor_nama: 'Budi Santoso',
    catatan_log: 'Tiket insiden breakdown dibuat oleh pelapor lapangan.',
    foto_lampiran_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'
  },
  {
    log_id: 'LOG-002',
    ticket_id: 'TKT-20260301-001',
    timestamp: new Date(Date.now() - 3600000 * 3.8).toISOString(),
    status_sebelum: 'SUBMITTED',
    status_sesudah: 'ASSIGNED',
    aktor_email: 'irfan.prasetyo@perusahaan.com',
    aktor_nama: 'Irfan Prasetyo, S.T.',
    catatan_log: 'Tiket ditugaskan kepada Teknisi Listrik Hendra Gunawan.',
    foto_lampiran_url: ''
  },
  {
    log_id: 'LOG-003',
    ticket_id: 'TKT-20260301-001',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    status_sebelum: 'ASSIGNED',
    status_sesudah: 'IN_PROGRESS',
    aktor_email: 'hendra.gunawan@perusahaan.com',
    aktor_nama: 'Hendra Gunawan',
    catatan_log: 'Teknisi tiba di Power House. Melakukan pemeriksaan sensor oli dan thermistor.',
    foto_lampiran_url: ''
  },
  {
    log_id: 'LOG-004',
    ticket_id: 'TKT-20260301-002',
    timestamp: new Date(Date.now() - 3600000 * 7).toISOString(),
    status_sebelum: 'NONE',
    status_sesudah: 'SUBMITTED',
    aktor_email: 'budi.santoso@perusahaan.com',
    aktor_nama: 'Budi Santoso',
    catatan_log: 'Temuan housekeeping 5R dilaporkan.',
    foto_lampiran_url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80'
  },
  {
    log_id: 'LOG-005',
    ticket_id: 'TKT-20260301-002',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    status_sebelum: 'SUBMITTED',
    status_sesudah: 'RESOLVED',
    aktor_email: 'ahmad.fauzi@perusahaan.com',
    aktor_nama: 'Ahmad Fauzi',
    catatan_log: 'Penertiban area selesai. Alat dikembalikan ke tool crib.',
    foto_lampiran_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80'
  }
];

// Helper to get from local storage or initialize
function getLocalStorageData<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(item);
  } catch (e) {
    return defaultVal;
  }
}

function setLocalStorageData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write failed:', e);
  }
}

// ============================================================================
// ADAPTER CLASS
// ============================================================================
class MaintenanceApiService {
  private isLiveBackend: boolean;
  private currentToken: string | null = null;
  private currentUser: UserProfile | null = null;

  constructor() {
    this.isLiveBackend = Boolean(GAS_API_URL && GAS_API_URL.startsWith('http'));
  }

  public setAuthSession(token: string | null, user: UserProfile | null) {
    this.currentToken = token;
    this.currentUser = user;
  }

  public isUsingMock(): boolean {
    return !this.isLiveBackend;
  }

  /**
   * Fetch complete dashboard telemetry data
   */
  async fetchDashboardData(): Promise<DashboardTelemetryData> {
    if (this.isLiveBackend) {
      try {
        const res = await fetch(`${GAS_API_URL}?action=get_dashboard_data`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      } catch (err) {
        console.warn('Live GAS fetch failed, falling back to cached mock:', err);
      }
    }

    // Offline / Mock Mode
    const users = getLocalStorageData<UserProfile[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const assets = getLocalStorageData<AssetMaster[]>(STORAGE_KEYS.ASSETS, DEFAULT_ASSETS);
    const incidents = getLocalStorageData<IncidentReport[]>(STORAGE_KEYS.INCIDENTS, DEFAULT_INCIDENTS);
    const logs = getLocalStorageData<TicketHistoryLog[]>(STORAGE_KEYS.LOGS, DEFAULT_LOGS);

    return {
      users,
      assets,
      incidents,
      logs,
      server_time: new Date().toISOString()
    };
  }

  /**
   * Fetch AI Telemetry Briefing (3 Structured Insights)
   */
  async fetchAiTelemetryBriefing(): Promise<AiTelemetryBriefing> {
    if (this.isLiveBackend) {
      try {
        const res = await fetch(`${GAS_API_URL}?action=get_ai_briefing`, {
          method: 'GET'
        });
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      } catch (err) {
        console.warn('AI briefing fetch failed, using fallback:', err);
      }
    }

    // High quality industrial deterministic simulation
    const incidents = getLocalStorageData<IncidentReport[]>(STORAGE_KEYS.INCIDENTS, DEFAULT_INCIDENTS);
    const activeCritical = incidents.filter(i => i.urgensi === 'Critical' && i.status_terkini !== 'CLOSED' && i.status_terkini !== 'RESOLVED');

    return {
      recurring_failure_alert: 'Aset GENSET-01 teridentifikasi mengalami 2x alarm overtemperature dalam 14 hari terakhir. Diperlukan flushing radiator dan kalibrasi sensor oli.',
      housekeeping_hotspot: 'Area Gudang Logistik A & Jalur Evakuasi menjadi hotspot 5R tertinggi dengan 3 laporan alat tidak pada tempatnya minggu ini.',
      actionable_recommendation: 'Instruksikan toolbox meeting sebelum pergantian shift dan prioritaskan penutupan tiket breakdown GENSET-01 agar cadangan daya operasional aman.',
      threat_level: activeCritical.length > 0 ? 'CRITICAL' : 'ELEVATED',
      generated_at: new Date().toISOString(),
      is_fallback: true
    };
  }

  /**
   * Interactive AI Copilot Query
   */
  async askAiCopilot(question: string, context?: any): Promise<AiCopilotResponse> {
    if (this.isLiveBackend) {
      try {
        const res = await fetch(GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ai_copilot_ask',
            question,
            context,
            id_token: this.currentToken,
            demo_user: this.currentUser
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      } catch (err) {
        console.warn('AI Copilot request failed, using intelligent simulation:', err);
      }
    }

    // Intelligent local simulation based on prompt keywords
    const qLower = question.toLowerCase();
    if (qLower.includes('mttr') || qLower.includes('lama') || qLower.includes('paling')) {
      return {
        answer: 'Aset dengan MTTR tertinggi saat ini adalah CRANE-QC-03 (rata-rata perbaikan 4.8 jam) diikuti oleh GENSET-01 yang masih dalam proses pengerjaan isolasi sensor.',
        recommended_action: 'Periksa ketersediaan suku cadang bearing dan jadwalkan teknisi spesialis hidrolik untuk mempercepat penyelesaian crane.',
        related_assets: ['CRANE-QC-03', 'GENSET-01']
      };
    }

    if (qLower.includes('5r') || qLower.includes('alat') || qLower.includes('tempat')) {
      return {
        answer: 'Terdapat 2 temuan 5R aktif di Gudang Logistik A dan Pompa Sentral Unit 1. Pelanggaran didominasi peralatan kerja yang tidak dikembalikan ke tool crib.',
        recommended_action: 'Terapkan checklist 5R 15 menit sebelum serah terima shift antar regu teknisi.',
        related_assets: ['NON-ASET']
      };
    }

    return {
      answer: `Berdasarkan status terkini, terdapat ${DEFAULT_INCIDENTS.filter(i => i.status_terkini !== 'CLOSED').length} tiket aktif. 1 aset berstatus Breakdown (GENSET-01) dan 1 aset Maintenance (CRANE-QC-03).`,
      recommended_action: 'Fokuskan teknisi shift 1 untuk menyelesaikan tiket prioritas Critical di Power House sebelum pergantian shift sore.',
      related_assets: ['GENSET-01', 'CRANE-QC-03']
    };
  }

  /**
   * AI Root-Cause Diagnostic & Troubleshooting Checklist
   */
  async getAiTroubleshootChecklist(ticketId: string): Promise<AiTroubleshootResult> {
    if (this.isLiveBackend) {
      try {
        const res = await fetch(GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ai_troubleshoot',
            ticket_id: ticketId,
            id_token: this.currentToken,
            demo_user: this.currentUser
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      } catch (err) {
        console.warn('AI troubleshoot failed, using local expert diagnostic:', err);
      }
    }

    // Expert diagnostic simulation
    const incidents = getLocalStorageData<IncidentReport[]>(STORAGE_KEYS.INCIDENTS, DEFAULT_INCIDENTS);
    const ticket = incidents.find(t => t.ticket_id === ticketId);

    const isGenset = ticket?.asset_id === 'GENSET-01';
    const is5R = ticket?.kategori_laporan === 'ALAT_TIDAK_PADA_TEMPATNYA';

    if (is5R) {
      return {
        probable_root_cause: 'Ketidakdisiplinan prosedur perapihan kerja (5R Seiri & Seiton) pasca intervensi darurat shift malam.',
        safety_precautions: [
          'Gunakan sarung tangan kerja heavy-duty untuk memindahkan peralatan berbeban berat.',
          'Pastikan rute forklift bebas halangan visual sebelum melakukan pemindahan material.'
        ],
        troubleshooting_steps: [
          'Amankan area temuan dengan cone barikade sementara.',
          'Identifikasi kepemilikan alat melalui kode register tool crib.',
          'Kembalikan peralatan ke rak gantung 5R yang telah dilabeli.',
          'Dokumentasikan foto kondisi akhir (After) sebagai bukti penertiban.'
        ],
        required_tools: ['Safety Gloves', 'Toolbox Organizer', 'Mobile Camera'],
        estimated_resolution_minutes: 15
      };
    }

    if (isGenset) {
      return {
        probable_root_cause: 'Kerusakan thermal probe sensor atau penyumbatan parsial pada heat exchanger oil cooler genset.',
        safety_precautions: [
          'Pasang LOTO (Lock-Out Tag-Out) pada switch utama pemutus arus genset.',
          'Biarkan mesin mendingin minimal 30 menit sebelum membuka manifold oli untuk menghindari bahaya luka bakar.'
        ],
        troubleshooting_steps: [
          'Lakukan pengukuran resistansi sensor suhu oli menggunakan multimeter terkalibrasi.',
          'Periksa level viskositas dan warna oli mesin; cek apakah terdapat kontaminasi serbuk logam.',
          'Inspeksi sirkulasi coolant pump dan bersihkan sirip-sirip radiator pendingin dari debu pekat.',
          'Jalankan running test tanpa beban (no-load) selama 10 menit dan monitor grafik suhu di control display.'
        ],
        required_tools: ['Multimeter Fluke Digital', 'Infrared Thermometer', 'Kunci Pas Set 10-24mm', 'Oil Catch Basin'],
        estimated_resolution_minutes: 60
      };
    }

    return {
      probable_root_cause: 'Indikasi beban lebih mekanikal atau keausan bearing pada unit penggerak.',
      safety_precautions: [
        'Pastikan tombol Emergency Stop dalam posisi terkunci sebelum inspeksi fisik.',
        'Wajib mengenakan helm safety dan sepatu berujung baja (steel toe boots).'
      ],
      troubleshooting_steps: [
        'Inspeksi visual kelurusan poros dan kondisi pelumasan grease.',
        'Lakukan uji vibrasi dengan vibration meter portabel.',
        'Kencangkan baut penopang pondasi yang terindikasi kendor.',
        'Lakukan functional test bertahap bersama operator.'
      ],
      required_tools: ['Vibration Pen', 'Kunci Torsi Mekanik', 'Grease Gun'],
      estimated_resolution_minutes: 45
    };
  }

  /**
   * Submit a new field incident report
   */
  async createIncident(payload: CreateTicketPayload): Promise<IncidentReport> {
    const actor = this.currentUser || DEFAULT_USERS[0];

    if (this.isLiveBackend) {
      try {
        const res = await fetch(GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_ticket',
            ...payload,
            id_token: this.currentToken,
            demo_user: actor
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      } catch (err) {
        console.warn('Live incident creation failed, recording locally:', err);
      }
    }

    // Mock Creation with LocalStorage
    const incidents = getLocalStorageData<IncidentReport[]>(STORAGE_KEYS.INCIDENTS, DEFAULT_INCIDENTS);
    const logs = getLocalStorageData<TicketHistoryLog[]>(STORAGE_KEYS.LOGS, DEFAULT_LOGS);
    const assets = getLocalStorageData<AssetMaster[]>(STORAGE_KEYS.ASSETS, DEFAULT_ASSETS);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const todayCount = incidents.filter(i => i.ticket_id.startsWith(`TKT-${dateStr}`)).length + 1;
    const ticketId = `TKT-${dateStr}-${String(todayCount).padStart(3, '0')}`;

    const newTicket: IncidentReport = {
      ticket_id: ticketId,
      created_at: now.toISOString(),
      kategori_laporan: payload.kategori_laporan,
      asset_id: payload.asset_id,
      lokasi_detail: payload.lokasi_detail,
      urgensi: payload.urgensi,
      deskripsi: payload.deskripsi,
      foto_awal_url: payload.foto_awal_base64 
        ? `data:image/jpeg;base64,${payload.foto_awal_base64}`
        : 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      pelapor_email: actor.email,
      pelapor_nama: actor.nama_lengkap,
      pelapor_unit: payload.pelapor_unit || actor.unit_kerja,
      status_terkini: 'SUBMITTED',
      pic_teknisi_email: '',
      pic_teknisi_nama: '',
      foto_akhir_url: '',
      catatan_penyelesaian: '',
      resolved_at: ''
    };

    incidents.unshift(newTicket);
    setLocalStorageData(STORAGE_KEYS.INCIDENTS, incidents);

    // Add Log
    const newLog: TicketHistoryLog = {
      log_id: `LOG-${Date.now().toString().slice(-6)}`,
      ticket_id: ticketId,
      timestamp: now.toISOString(),
      status_sebelum: 'NONE',
      status_sesudah: 'SUBMITTED',
      aktor_email: actor.email,
      aktor_nama: actor.nama_lengkap,
      catatan_log: `Laporan dibuat oleh ${actor.nama_lengkap} (${payload.kategori_laporan})`,
      foto_lampiran_url: newTicket.foto_awal_url
    };
    logs.unshift(newLog);
    setLocalStorageData(STORAGE_KEYS.LOGS, logs);

    // Update asset status if breakdown
    if (payload.asset_id && payload.asset_id !== 'NON-ASET') {
      const targetAsset = assets.find(a => a.asset_id === payload.asset_id);
      if (targetAsset && payload.kategori_laporan === 'KERUSAKAN') {
        targetAsset.status_operasional = payload.urgensi === 'Critical' ? 'Breakdown' : 'Maintenance';
        targetAsset.last_updated = now.toISOString();
        setLocalStorageData(STORAGE_KEYS.ASSETS, assets);
      }
    }

    return newTicket;
  }

  /**
   * Update ticket status & log lifecycle event
   */
  async updateTicketStatus(payload: UpdateTicketPayload): Promise<IncidentReport> {
    const actor = this.currentUser || DEFAULT_USERS[3];

    if (this.isLiveBackend) {
      try {
        const res = await fetch(GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_ticket_status',
            ...payload,
            id_token: this.currentToken,
            demo_user: actor
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      } catch (err) {
        console.warn('Live ticket update failed, recording locally:', err);
      }
    }

    // Mock Update with LocalStorage
    const incidents = getLocalStorageData<IncidentReport[]>(STORAGE_KEYS.INCIDENTS, DEFAULT_INCIDENTS);
    const logs = getLocalStorageData<TicketHistoryLog[]>(STORAGE_KEYS.LOGS, DEFAULT_LOGS);
    const assets = getLocalStorageData<AssetMaster[]>(STORAGE_KEYS.ASSETS, DEFAULT_ASSETS);

    const index = incidents.findIndex(i => i.ticket_id === payload.ticket_id);
    if (index === -1) throw new Error(`Tiket ${payload.ticket_id} tidak ditemukan.`);

    const currentTicket = incidents[index];
    const prevStatus = currentTicket.status_terkini;
    const nextStatus = payload.status_terkini;
    const now = new Date().toISOString();

    let fotoAkhir = currentTicket.foto_akhir_url;
    if (payload.foto_akhir_base64) {
      fotoAkhir = `data:image/jpeg;base64,${payload.foto_akhir_base64}`;
    }

    currentTicket.status_terkini = nextStatus;
    if (payload.pic_teknisi_email !== undefined) currentTicket.pic_teknisi_email = payload.pic_teknisi_email;
    if (payload.pic_teknisi_nama !== undefined) currentTicket.pic_teknisi_nama = payload.pic_teknisi_nama;
    if (payload.catatan_penyelesaian !== undefined) currentTicket.catatan_penyelesaian = payload.catatan_penyelesaian;
    if (fotoAkhir) currentTicket.foto_akhir_url = fotoAkhir;

    if (nextStatus === 'RESOLVED' || nextStatus === 'CLOSED') {
      currentTicket.resolved_at = now;
    }

    incidents[index] = currentTicket;
    setLocalStorageData(STORAGE_KEYS.INCIDENTS, incidents);

    // Append Audit Log
    const logEntry: TicketHistoryLog = {
      log_id: `LOG-${Date.now().toString().slice(-6)}`,
      ticket_id: payload.ticket_id,
      timestamp: now,
      status_sebelum: prevStatus,
      status_sesudah: nextStatus,
      aktor_email: actor.email,
      aktor_nama: actor.nama_lengkap,
      catatan_log: payload.catatan_log || `Status diubah dari ${prevStatus} ke ${nextStatus} oleh ${actor.nama_lengkap}`,
      foto_lampiran_url: fotoAkhir || ''
    };
    logs.unshift(logEntry);
    setLocalStorageData(STORAGE_KEYS.LOGS, logs);

    // Sync Asset Status: if resolved/closed, check if other active breakdown tickets remain
    if (currentTicket.asset_id && currentTicket.asset_id !== 'NON-ASET') {
      const asset = assets.find(a => a.asset_id === currentTicket.asset_id);
      if (asset) {
        if (nextStatus === 'RESOLVED' || nextStatus === 'CLOSED') {
          const remainingBreakdowns = incidents.filter(i => 
            i.asset_id === currentTicket.asset_id &&
            i.kategori_laporan === 'KERUSAKAN' &&
            ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].includes(i.status_terkini)
          );
          if (remainingBreakdowns.length === 0) {
            asset.status_operasional = 'Ready';
            asset.last_updated = now;
            setLocalStorageData(STORAGE_KEYS.ASSETS, assets);
          }
        } else if (nextStatus === 'IN_PROGRESS') {
          asset.status_operasional = 'Maintenance';
          asset.last_updated = now;
          setLocalStorageData(STORAGE_KEYS.ASSETS, assets);
        }
      }
    }

    return currentTicket;
  }

  /**
   * Update user role & active status (Admin / Supervisor only)
   */
  async updateUserRole(email: string, role: UserRole, spesialisasi?: string, shift?: string, status_aktif?: string): Promise<UserProfile> {
    const actor = this.currentUser || DEFAULT_USERS[4];

    if (this.isLiveBackend) {
      try {
        const res = await fetch(GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_user_role',
            email,
            role,
            spesialisasi,
            shift,
            status_aktif,
            id_token: this.currentToken,
            demo_user: actor
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      } catch (err) {
        console.warn('Live user role update failed, recording locally:', err);
      }
    }

    // Mock Update
    const users = getLocalStorageData<UserProfile[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!targetUser) throw new Error(`User ${email} tidak ditemukan.`);

    targetUser.role = role;
    if (spesialisasi !== undefined) targetUser.spesialisasi = spesialisasi;
    if (shift !== undefined) targetUser.shift = shift;
    if (status_aktif !== undefined) targetUser.status_aktif = status_aktif;

    setLocalStorageData(STORAGE_KEYS.USERS, users);
    return targetUser;
  }

  /**
   * Reset local storage data back to initial seeds
   */
  resetLocalData(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.ASSETS);
    localStorage.removeItem(STORAGE_KEYS.INCIDENTS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  }
}

export const maintenanceApi = new MaintenanceApiService();
