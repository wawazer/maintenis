# MAINTENIS — Industrial CMMS Lite & Operational Telemetry Dashboard

[![Tech Stack](https://img.shields.io/badge/Stack-React_19_|_TypeScript_|_Tailwind_CSS-0f172a?style=flat-square)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg?style=flat-square)](LICENSE)
[![AI Engine](https://img.shields.io/badge/AI_Engine-Gemini_2.5_Flash_|_Groq_Llama_3.3-cyan.svg?style=flat-square)](https://aistudio.google.com/)
[![Backend](https://img.shields.io/badge/Backend-Google_Sheets_+_Apps_Script-34a853.svg?style=flat-square)](https://www.google.com/sheets/about/)

**Maintenis** is a production-grade **Multi-User Maintenance & Engineering Department Monitoring Dashboard + Field Incident Reporting System (CMMS Lite)** designed for industrial plant operations, terminal facilities, and manufacturing control rooms.

Powered by a **5-Tab Google Spreadsheet + Google Apps Script Web App** backend with **Google SSO Authentication & Multi-User RBAC**, client-side Canvas photo compression, and an **Embedded AI Reliability Analyst** powered by Free-Tier LLMs (Google Gemini 2.5 Flash / Groq Llama 3.3).

---

## 🏗️ Architectural Foundations

### 1. Ponytails Architecture (Clean, Modular, Zero-Spaghetti)
- **Strict Separation of Concerns:**
  - `src/types/`: Strict TypeScript interfaces for Users, Assets, Incidents, Audit Logs, and AI schemas.
  - `src/context/AuthContext.tsx`: Google SSO JWT token management & RBAC authorization engine with Demo Role Switcher.
  - `src/services/maintenanceApi.ts`: Agnostic backend adapter with automatic token injection and seamless local persistence fallback.
  - `src/utils/imageCompressor.ts`: Client-side Canvas compressor (max 800px width JPEG Base64 < 150KB) for instant field upload.
  - `src/components/common/`: Atomic primitives (`StatusBadge`, `KpiCard`, `RoleGuard`, `Toast`, `SkeletonLoader`).
  - `src/components/ai/`: High-density intelligence banner, Interactive Copilot drawer, and Technician troubleshooting helper.
  - `src/components/dashboard/`: Control bar, live 30s auto-polling, Recharts telemetry charts, critical asset watchlist, and active queue table.
  - `src/components/reporting/`: Field report slide-over modal with category cards and AI urgency auto-classification.
  - `src/components/ticket/`: Slide-over drawer with side-by-side Before/After photos and chronological audit trail.

### 2. Anti-Slop Industrial Design Mandate
- **No generic AI tropes:** Zero purple/indigo gradients, zero sparkly magic wands, zero unaligned glassmorphism.
- **Mission-Control Aesthetics:** Inspired by Linear, Grafana, and Vercel Dashboard. Crisp 1px structural borders, tabular numerals (`font-variant-numeric: tabular-nums`) for all metrics, ticket IDs, and timestamps.
- **Semantic Color Palette:**
  - `Emerald` (`#10b981`): Ready / Resolved / Normal SLA
  - `Amber` (`#f59e0b`): In Progress / 5R Housekeeping / Assigned
  - `Rose` (`#f43f5e`): Breakdown / Critical Failure / High Risk
  - `Slate` (`#64748b`): Neutral / Closed / System Logs
  - `Cyan` (`#06b6d4`): AI Telemetry Insights & Copilot

### 3. UI/UX Pro Max Principles
- **Dual Display Ergonomics:** High-density control room monitoring with dedicated **TV / Kiosk Mode** (scales typography and hides chrome) alongside a mobile-first, thumb-friendly reporting flow (< 30s submission time).
- **Instant Feedback:** Skeleton loaders during sync and AI inference, side-by-side visual photo comparisons, and reactive toast notifications.

---

## 👥 Multi-User Role-Based Access Control (RBAC)

| Role | Permissions & Capabilities |
| :--- | :--- |
| **`PELAPOR`** | Auto-provisioned for verified Google accounts. Submit new incident reports, auto-filled reporter identity, view live dashboard status, and track own reported tickets. |
| **`TEKNISI`** | Claim/update assigned tickets (`IN_PROGRESS`, `ON_HOLD`, `RESOLVED`), upload *Foto Hasil Perbaikan (After)*, use AI Root Cause diagnostic helper, and log technical resolution notes. |
| **`SUPERVISOR`** | Full operational command. Assign `PIC Teknisi`, close verified tickets (`CLOSED`), run AI Executive Anomaly Analysis, and manage asset watchlist. |
| **`ADMIN`** | Full system administration. Manage user roles in `Master_Users`, assign technician specialization/shift, toggle user active status, and configure SLAs. |

*Actor Attribution: Every ticket creation and status update automatically logs the authenticated actor's name and email into immutable audit logs.*

---

## 🧠 Embedded AI Maintenance Analyst (Free-Tier LLM Proxy)

All AI features execute server-side in Google Apps Script (or run deterministic industrial expert rules when offline/no API key is configured):

1. **AI Operational Telemetry Briefing (`AiTelemetryBanner`):**
   - High-density intelligence strip on the dashboard analyzing aggregated spreadsheet data.
   - Outputs 3 structured insights in Bahasa Indonesia:
     1. **Recurring Failure Alert** (identifies machinery breaking down $\ge 2$ times recently).
     2. **5R / Housekeeping Hotspot** (detects areas with repeated misplaced tool hazards).
     3. **Supervisor Tactical Action Plan** (actionable recommendation for shift lead).
   - Cached for 15 minutes using `CacheService` to remain comfortably within free-tier rate limits.
2. **Interactive "Ask Maintenance Data" Copilot (`AiDataCopilot`):**
   - Natural language Q&A interface for supervisors & engineers (e.g., *"Aset mana yang MTTR-nya paling lama?"*, *"Ringkas kendala shift pagi"*).
3. **Technician Root-Cause & Action Suggester (`AiTroubleshootCard`):**
   - One-click diagnostic assistant inside the ticket drawer providing probable root cause, K3/LOTO safety precautions, step-by-step checkable troubleshooting procedure, required tools, and estimated completion time.

---

## 📊 Google Sheets Database Schema (5 Tabs)

1. **`Master_Users`**: `user_id`, `email`, `nama_lengkap`, `avatar_url`, `unit_kerja`, `role`, `spesialisasi`, `shift`, `status_aktif`, `last_login`
2. **`Master_Aset`**: `asset_id`, `nama_aset`, `kategori`, `lokasi_area`, `status_operasional` (`Ready`, `Breakdown`, `Maintenance`), `kritikalitas` (`High`, `Medium`, `Low`), `last_updated`
3. **`Incident_Reports`**: `ticket_id` (`TKT-YYYYMMDD-XXX`), `created_at`, `kategori_laporan` (`KERUSAKAN`, `ALAT_TIDAK_PADA_TEMPATNYA`), `asset_id`, `lokasi_detail`, `urgensi`, `deskripsi`, `foto_awal_url`, `pelapor_email`, `pelapor_nama`, `pelapor_unit`, `status_terkini`, `pic_teknisi_email`, `pic_teknisi_nama`, `foto_akhir_url`, `catatan_penyelesaian`, `resolved_at`
4. **`Ticket_History_Logs`**: `log_id`, `ticket_id`, `timestamp`, `status_sebelum`, `status_sesudah`, `aktor_email`, `aktor_nama`, `catatan_log`, `foto_lampiran_url`
5. **`App_Config`**: `config_key`, `config_value` (`ALLOWED_EMAIL_DOMAINS`, `AUTO_APPROVE_NEW_USERS`, `SLA_CRITICAL_MINUTES`, `AI_PROVIDER`)

---

## 🚀 Setup & Deployment Guide

### A. Quick Start (Zero-Config Offline Mock Mode)
You can run and test the complete application immediately without any Google Cloud or Apps Script setup:
```bash
# 1. Clone repository
git clone https://github.com/your-username/maintenis.git
cd maintenis

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
Open `http://localhost:5173`. Use the **Quick Role Switcher** cards on the login screen to test as `PELAPOR`, `TEKNISI`, `SUPERVISOR`, or `ADMIN`. State changes persist locally in your browser.

---

### B. Google Apps Script Backend Deployment

1. **Create Google Spreadsheet:**
   - Go to [Google Sheets](https://sheets.new) and create a new blank spreadsheet named `Maintenis_Database`.
2. **Open Apps Script Editor:**
   - In the spreadsheet menu, click **Extensions** > **Apps Script**.
3. **Paste Backend Code:**
   - Delete any default code in `Code.gs` and paste the entire contents of [`backend/Code.gs`](backend/Code.gs).
4. **Obtain Free Google AI Studio API Key:**
   - Visit [Google AI Studio](https://aistudio.google.com/).
   - Click **Get API key** > **Create API key in new project** (100% Free Tier: Gemini 2.5 Flash).
   - In Apps Script, go to **Project Settings** (gear icon) > **Script Properties** > **Add script property**:
     - Property: `GEMINI_API_KEY`
     - Value: `YOUR_GEMINI_API_KEY_HERE`
     *(Optional: Set `AI_PROVIDER` to `GROQ` and add `GROQ_API_KEY` if you prefer Groq Llama 3.3)*.
5. **Initialize Database Tabs:**
   - In the Apps Script code editor, select the function `setupSpreadsheet` from the dropdown and click **Run**.
   - Review permissions and authorize the script.
   - Switch to your Google Sheet to verify that all 5 tabs and initial realistic seed data have been generated!
6. **Deploy as Web App:**
   - In the top-right corner of Apps Script, click **Deploy** > **New deployment**.
   - Click the gear icon > select **Web app**.
   - Configure:
     - **Description:** `Maintenis Production API v1`
     - **Execute as:** `Me (your-email@gmail.com)`
     - **Who has access:** `Anyone`
   - Click **Deploy** and copy the **Web App URL** (format: `https://script.google.com/macros/s/AKfycb.../exec`).

---

### C. Google OAuth 2.0 Web Client ID Setup

1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Click **Create Credentials** > **OAuth client ID**.
3. Application type: **Web application**.
4. Name: `Maintenis Frontend`.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (for local development)
   - `https://your-production-domain.vercel.app` (when deployed)
6. Click **Create** and copy your **Client ID** (format: `...apps.googleusercontent.com`).

---

### D. Connect Frontend to Google Backend

Create `.env.local` in the project root:
```env
VITE_GAS_API_URL=https://script.google.com/macros/s/AKfycbx.../exec
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Build and test production preview:
```bash
npm run build
npm run preview
```

---

## 🛡️ License
Distributed under the **MIT License**. 100% Open-Source and free for commercial enterprise maintenance departments.
