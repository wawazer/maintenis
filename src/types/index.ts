/**
 * MAINTENIS - Domain Type Definitions
 * Strict TypeScript types corresponding to 5 Google Sheet tabs & AI Schemas
 */

export type UserRole = 'PELAPOR' | 'TEKNISI' | 'SUPERVISOR' | 'ADMIN';

export type TicketCategory = 'KERUSAKAN' | 'ALAT_TIDAK_PADA_TEMPATNYA';

export type UrgencyLevel = 'Normal' | 'Urgent' | 'Critical';

export type TicketStatus = 
  | 'SUBMITTED' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'ON_HOLD' 
  | 'RESOLVED' 
  | 'CLOSED';

export type AssetOperationalStatus = 'Ready' | 'Breakdown' | 'Maintenance';

export type AssetCriticality = 'High' | 'Medium' | 'Low';

export type WorkShift = 'Shift 1 (Pagi)' | 'Shift 2 (Sore)' | 'Shift 3 (Malam)' | 'Normal Day';

// 1. Master_Users
export interface UserProfile {
  user_id: string;
  email: string;
  nama_lengkap: string;
  avatar_url?: string;
  unit_kerja: string;
  role: UserRole;
  spesialisasi?: string;
  shift?: WorkShift | string;
  status_aktif: boolean | string;
  last_login?: string;
}

// 2. Master_Aset
export interface AssetMaster {
  asset_id: string;
  nama_aset: string;
  kategori: string;
  lokasi_area: string;
  status_operasional: AssetOperationalStatus;
  kritikalitas: AssetCriticality;
  last_updated: string;
  current_incident_count?: number;
}

// 3. Incident_Reports
export interface IncidentReport {
  ticket_id: string; // TKT-YYYYMMDD-XXX
  created_at: string;
  kategori_laporan: TicketCategory;
  asset_id: string; // ID or 'NON-ASET'
  lokasi_detail: string;
  urgensi: UrgencyLevel;
  deskripsi: string;
  foto_awal_url: string;
  pelapor_email: string;
  pelapor_nama: string;
  pelapor_unit: string;
  status_terkini: TicketStatus;
  pic_teknisi_email?: string;
  pic_teknisi_nama?: string;
  foto_akhir_url?: string;
  catatan_penyelesaian?: string;
  resolved_at?: string;
}

// 4. Ticket_History_Logs
export interface TicketHistoryLog {
  log_id: string;
  ticket_id: string;
  timestamp: string;
  status_sebelum: string;
  status_sesudah: string;
  aktor_email: string;
  aktor_nama: string;
  catatan_log: string;
  foto_lampiran_url?: string;
}

// 5. App_Config
export interface AppConfig {
  config_key: string;
  config_value: string;
}

// AI Operational Telemetry Briefing Structure
export interface AiTelemetryBriefing {
  recurring_failure_alert: string;
  housekeeping_hotspot: string;
  actionable_recommendation: string;
  threat_level: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  generated_at: string;
  is_fallback?: boolean;
}

// AI Copilot Q&A Response
export interface AiCopilotResponse {
  answer: string;
  recommended_action: string;
  related_assets?: string[];
  is_fallback?: boolean;
}

// AI Technician Troubleshooting Checklist
export interface AiTroubleshootResult {
  probable_root_cause: string;
  safety_precautions: string[];
  troubleshooting_steps: string[];
  required_tools: string[];
  estimated_resolution_minutes: number;
  is_fallback?: boolean;
}

// Consolidated Dashboard Payload
export interface DashboardTelemetryData {
  users: UserProfile[];
  assets: AssetMaster[];
  incidents: IncidentReport[];
  logs: TicketHistoryLog[];
  configs?: AppConfig[];
  server_time: string;
}

// New Ticket Submission Payload
export interface CreateTicketPayload {
  kategori_laporan: TicketCategory;
  asset_id: string;
  lokasi_detail: string;
  urgensi: UrgencyLevel;
  deskripsi: string;
  foto_awal_base64?: string;
  pelapor_unit?: string;
}

// Update Ticket Status Payload
export interface UpdateTicketPayload {
  ticket_id: string;
  status_terkini: TicketStatus;
  pic_teknisi_email?: string;
  pic_teknisi_nama?: string;
  catatan_penyelesaian?: string;
  catatan_log?: string;
  foto_akhir_base64?: string;
}
