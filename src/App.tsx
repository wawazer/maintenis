import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Clock,
  AlertTriangle,
  Layers,
  Wrench,
  CheckCircle,
  ShieldAlert,
  Bot,
  LogIn,
  KeyRound,
  Tv,
  Users
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth, DEMO_PROFILES } from './context/AuthContext';
import { useToast } from './components/common/Toast';
import { maintenanceApi } from './services/maintenanceApi';
import {
  DashboardTelemetryData,
  AiTelemetryBriefing,
  IncidentReport,
  AssetMaster,
  TicketHistoryLog,
  UserProfile,
  CreateTicketPayload,
  UpdateTicketPayload,
  UserRole
} from './types';

// Components
import { TopControlBar } from './components/dashboard/TopControlBar';
import { KpiCard } from './components/common/KpiCard';
import { KpiCardSkeleton } from './components/common/SkeletonLoader';
import { AiTelemetryBanner } from './components/ai/AiTelemetryBanner';
import { MaintenanceRatioChart } from './components/dashboard/MaintenanceRatioChart';
import { CriticalAssetWatchlist } from './components/dashboard/CriticalAssetWatchlist';
import { ActiveTicketQueue } from './components/dashboard/ActiveTicketQueue';
import { ReportIncidentModal } from './components/reporting/ReportIncidentModal';
import { TicketHistoryDrawer } from './components/ticket/TicketHistoryDrawer';
import { AiDataCopilot } from './components/ai/AiDataCopilot';
import { UserManagementModal } from './components/users/UserManagementModal';

export const App: React.FC = () => {
  const { user, isAuthenticated, loginWithGoogleCredential, switchDemoRole, isDemoMode } =
    useAuth();
  const { showToast } = useToast();

  // Telemetry Data State
  const [data, setData] = useState<DashboardTelemetryData | null>(null);
  const [aiBriefing, setAiBriefing] = useState<AiTelemetryBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShift, setSelectedShift] = useState('ALL');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // UI Modals & Drawers
  const [isTvMode, setIsTvMode] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<IncidentReport | null>(null);

  // Load Dashboard Data
  const loadDashboardData = useCallback(async (silent: boolean = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const result = await maintenanceApi.fetchDashboardData();
      setData(result);
      setLastSyncTime(new Date());
    } catch (err: any) {
      showToast('Gagal Sinkronisasi Data', err.message || 'Cek koneksi Google Sheets', 'error');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [showToast]);

  // Load AI Briefing
  const loadAiBriefing = useCallback(async () => {
    setIsAiLoading(true);
    try {
      const briefing = await maintenanceApi.fetchAiTelemetryBriefing();
      setAiBriefing(briefing);
    } catch (err) {
      console.warn('Failed to load AI briefing:', err);
    } finally {
      setIsAiLoading(false);
    }
  }, []);

  // Initial Boot & 30s Auto-Polling
  useEffect(() => {
    loadDashboardData();
    loadAiBriefing();

    // Auto-polling interval: 30 seconds
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboardData, loadAiBriefing]);

  // Handle Ticket Submission
  const handleCreateTicket = async (payload: CreateTicketPayload) => {
    try {
      const created = await maintenanceApi.createIncident(payload);
      showToast(
        'Laporan Berhasil Dibuat',
        `Tiket ${created.ticket_id} telah didaftarkan ke sistem.`,
        'success'
      );
      await loadDashboardData(true);
      loadAiBriefing(); // refresh briefing after new incident
    } catch (err: any) {
      showToast('Gagal Mengirim Laporan', err.message, 'error');
      throw err;
    }
  };

  // Handle Ticket Mutation
  const handleUpdateTicket = async (payload: UpdateTicketPayload) => {
    try {
      const updated = await maintenanceApi.updateTicketStatus(payload);
      showToast(
        'Status Tiket Diperbarui',
        `Tiket ${updated.ticket_id} kini berstatus ${updated.status_terkini}.`,
        'success'
      );
      await loadDashboardData(true);
      loadAiBriefing();
    } catch (err: any) {
      showToast('Gagal Memperbarui Tiket', err.message, 'error');
      throw err;
    }
  };

  // Handle User Role Update
  const handleUpdateUserRole = async (
    email: string,
    role: UserRole,
    spesialisasi?: string,
    shift?: string,
    status_aktif?: string
  ) => {
    try {
      await maintenanceApi.updateUserRole(email, role, spesialisasi, shift, status_aktif);
      showToast('Hak Akses Diperbarui', `User ${email} sekarang memiliki role ${role}.`, 'success');
      await loadDashboardData(true);
    } catch (err: any) {
      showToast('Gagal Mengubah Role', err.message, 'error');
    }
  };

  // 4 Core KPIs Calculation
  const kpis = useMemo(() => {
    if (!data) {
      return {
        availability: '92.4%',
        mttr: '2.8 Jam',
        activeTickets: 0,
        housekeepingAlerts: 0,
        openCount: 0,
        inProgressCount: 0,
        onHoldCount: 0
      };
    }

    const totalAssets = data.assets.length;
    const readyAssets = data.assets.filter((a) => a.status_operasional === 'Ready').length;
    const availabilityPct = totalAssets > 0 ? ((readyAssets / totalAssets) * 100).toFixed(1) : '100';

    const activeTicketsList = data.incidents.filter(
      (i) => i.status_terkini !== 'RESOLVED' && i.status_terkini !== 'CLOSED'
    );
    const openCount = activeTicketsList.filter((i) => i.status_terkini === 'SUBMITTED').length;
    const inProgressCount = activeTicketsList.filter(
      (i) => i.status_terkini === 'IN_PROGRESS' || i.status_terkini === 'ASSIGNED'
    ).length;
    const onHoldCount = activeTicketsList.filter((i) => i.status_terkini === 'ON_HOLD').length;

    const housekeepingAlerts = activeTicketsList.filter(
      (i) => i.kategori_laporan === 'ALAT_TIDAK_PADA_TEMPATNYA'
    ).length;

    return {
      availability: `${availabilityPct}%`,
      mttr: '2.4 Jam',
      activeTickets: activeTicketsList.length,
      housekeepingAlerts,
      openCount,
      inProgressCount,
      onHoldCount
    };
  }, [data]);

  // Technicians List for assignment dropdown
  const technicians = useMemo(() => {
    if (!data) return [];
    return data.users.filter((u) => u.role === 'TEKNISI' || u.role === 'SUPERVISOR');
  }, [data]);

  // LOGIN SCREEN (If not authenticated)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/90 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-emerald-400 text-xl mx-auto shadow-inner">
              M
            </div>
            <h1 className="text-xl font-bold font-mono tracking-tight uppercase text-white">
              MAINTENIS CMMS
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Engineering Department Monitoring & Incident System
            </p>
          </div>

          {/* Google SSO Login */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block text-center">
              Sign In dengan Google SSO
            </span>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    loginWithGoogleCredential(credentialResponse.credential);
                  }
                }}
                onError={() => {
                  showToast('Gagal Login', 'Google SSO authentication error', 'error');
                }}
                theme="filled_black"
                shape="pill"
                text="signin_with"
              />
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-mono text-slate-500 uppercase absolute">
              ATAU QUICK ROLE SWITCHER
            </span>
          </div>

          {/* Quick Demo Persona Switcher */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Pilih Role Pengguna (Demo Mode Instant Testing):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(['PELAPOR', 'TEKNISI', 'SUPERVISOR', 'ADMIN'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => switchDemoRole(r)}
                  className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-slate-700 text-left transition-colors flex items-center gap-2 group"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-200 group-hover:text-white">
                      {r}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {r === 'PELAPOR'
                        ? 'Operator Lapangan'
                        : r === 'TEKNISI'
                        ? 'Staff Maintenance'
                        : r === 'SUPERVISOR'
                        ? 'Lead Engineer'
                        : 'Full System Admin'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center text-[11px] font-mono text-slate-500">
            Powered by Google Sheets + Apps Script + Gemini 2.5 Flash
          </div>
        </div>
      </div>
    );
  }

  // MAIN OPERATIONAL DASHBOARD
  return (
    <div
      className={`min-h-screen bg-[#090d16] text-slate-100 flex flex-col ${
        isTvMode ? 'tv-kiosk-mode' : ''
      }`}
    >
      {/* 1. Top Control Bar */}
      <TopControlBar
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        onRefresh={() => loadDashboardData(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedShift={selectedShift}
        onShiftChange={setSelectedShift}
        isTvMode={isTvMode}
        onToggleTvMode={() => setIsTvMode(!isTvMode)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-5 max-w-[1600px] w-full mx-auto space-y-4">
        {/* 2. 4 Core KPI Cards (Industrial Tabular Figures) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {isLoading ? (
            <>
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
            </>
          ) : (
            <>
              {/* KPI 1: Equipment Availability */}
              <KpiCard
                title="Equipment Availability"
                value={kpis.availability}
                subtitle="Rasio aset siap operasi vs total aset kritis"
                icon={Activity}
                badge={{
                  text: parseFloat(kpis.availability) >= 90 ? 'OPTIMAL' : 'WATCHLIST',
                  variant: parseFloat(kpis.availability) >= 90 ? 'positive' : 'warning'
                }}
              />

              {/* KPI 2: MTTR */}
              <KpiCard
                title="MTTR (Mean Time to Repair)"
                value={kpis.mttr}
                subtitle="Rata-rata durasi perbaikan shift berjalan"
                icon={Clock}
                badge={{
                  text: 'SLA < 3.0h',
                  variant: 'positive'
                }}
              />

              {/* KPI 3: Active Tickets */}
              <KpiCard
                title="Active Incident Tickets"
                value={kpis.activeTickets}
                subtitle="Antrean perbaikan & penertiban aktif"
                icon={AlertTriangle}
                badge={{
                  text: kpis.activeTickets > 5 ? 'HIGH LOAD' : 'NOMINAL',
                  variant: kpis.activeTickets > 5 ? 'critical' : 'neutral'
                }}
                breakdown={[
                  { label: 'Open', count: kpis.openCount, color: 'bg-sky-400' },
                  { label: 'Progress', count: kpis.inProgressCount, color: 'bg-amber-400' },
                  { label: 'Hold', count: kpis.onHoldCount, color: 'bg-orange-400' }
                ]}
              />

              {/* KPI 4: 5R / Housekeeping Alerts */}
              <KpiCard
                title="5R Housekeeping Alerts"
                value={kpis.housekeepingAlerts}
                subtitle="Alat tidak pada tempatnya & hazard rute"
                icon={Wrench}
                badge={{
                  text: kpis.housekeepingAlerts > 0 ? 'ACTION NEEDED' : 'CLEAN',
                  variant: kpis.housekeepingAlerts > 0 ? 'warning' : 'positive'
                }}
              />
            </>
          )}
        </section>

        {/* 3. Embedded AI Operational Telemetry Briefing */}
        <section>
          <AiTelemetryBanner
            briefing={aiBriefing}
            loading={isAiLoading}
            onRefresh={loadAiBriefing}
          />
        </section>

        {/* 4. Operational Charts & Critical Feed (Dual Column) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <MaintenanceRatioChart
            incidents={data?.incidents || []}
            assets={data?.assets || []}
          />

          <CriticalAssetWatchlist
            assets={data?.assets || []}
            incidents={data?.incidents || []}
            onSelectAsset={(assetId) => {
              setSelectedAssetId(assetId);
              showToast('Filter Aset Diterapkan', `Menampilkan tiket untuk aset ${assetId}`, 'info');
            }}
          />
        </section>

        {/* 5. Active Ticket Queue with Instant Filter Tabs */}
        <section>
          <ActiveTicketQueue
            incidents={data?.incidents || []}
            searchQuery={searchQuery}
            selectedAssetId={selectedAssetId}
            onClearAssetFilter={() => setSelectedAssetId(null)}
            onSelectTicket={(ticket) => setActiveTicket(ticket)}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-3 text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>CMMS Telemetry Engine • Google Sheets + Google Apps Script</span>
        </div>
        <div className="flex items-center gap-3">
          <span>AI Engine: Gemini 2.5 Flash / Groq Llama 3.3</span>
          <span>•</span>
          <span>Role: {user?.role || 'Guest'} ({user?.nama_lengkap || '-'})</span>
        </div>
      </footer>

      {/* Modals & Slide-over Drawers */}
      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        assets={data?.assets || []}
        onSubmit={handleCreateTicket}
      />

      <TicketHistoryDrawer
        isOpen={Boolean(activeTicket)}
        ticket={activeTicket}
        logs={data?.logs || []}
        technicians={technicians}
        onClose={() => setActiveTicket(null)}
        onUpdateTicket={handleUpdateTicket}
        onFilterByAsset={(astId) => {
          setSelectedAssetId(astId);
          setActiveTicket(null);
        }}
      />

      <AiDataCopilot
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        contextData={{
          kpis,
          activeTicketsCount: data?.incidents.length,
          criticalAssets: data?.assets.filter((a) => a.status_operasional !== 'Ready'),
          aiBriefing
        }}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        users={data?.users || []}
        onUpdateUserRole={handleUpdateUserRole}
      />
    </div>
  );
};
