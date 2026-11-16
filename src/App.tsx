import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Clock,
  AlertTriangle,
  Wrench,
  KeyRound
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from './context/AuthContext';
import { useToast } from './components/common/Toast';
import { maintenanceApi } from './services/maintenanceApi';
import {
  DashboardTelemetryData,
  AiTelemetryBriefing,
  CreateTicketPayload,
  UpdateTicketPayload,
  UserRole
} from './types';

function getShiftFromTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Shift 1 (Pagi)';
  const hour = date.getHours();
  if (hour >= 6 && hour < 14) return 'Shift 1 (Pagi)';
  if (hour >= 14 && hour < 22) return 'Shift 2 (Sore)';
  return 'Shift 3 (Malam)';
}

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
  const { user, isAuthenticated, loginWithGoogleCredential, switchDemoRole } = useAuth();
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
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  const activeTicket = useMemo(() => {
    if (!activeTicketId || !data) return null;
    return data.incidents.find((i) => i.ticket_id === activeTicketId) || null;
  }, [activeTicketId, data]);

  useEffect(() => {
    if (isTvMode) {
      document.body.classList.add('tv-kiosk-mode');
    } else {
      document.body.classList.remove('tv-kiosk-mode');
    }
    return () => document.body.classList.remove('tv-kiosk-mode');
  }, [isTvMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (activeTicketId) setActiveTicketId(null);
      else if (isReportModalOpen) setIsReportModalOpen(false);
      else if (isCopilotOpen) setIsCopilotOpen(false);
      else if (isUserManagementOpen) setIsUserManagementOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTicketId, isReportModalOpen, isCopilotOpen, isUserManagementOpen]);

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

    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboardData, loadAiBriefing]);

  const shiftFilteredIncidents = useMemo(() => {
    if (!data) return [];
    if (selectedShift === 'ALL') return data.incidents;
    return data.incidents.filter(
      (inc) => getShiftFromTimestamp(inc.created_at) === selectedShift
    );
  }, [data, selectedShift]);

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
      loadAiBriefing();
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
        availability: '100%',
        mttr: '-',
        mttrHours: 0,
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

    const resolvedWithDuration = shiftFilteredIncidents.filter(
      (i) => (i.status_terkini === 'RESOLVED' || i.status_terkini === 'CLOSED') && i.resolved_at
    );

    let mttrLabel = 'N/A';
    let mttrHours = 0;
    if (resolvedWithDuration.length > 0) {
      const totalMs = resolvedWithDuration.reduce((sum, item) => {
        const start = new Date(item.created_at).getTime();
        const end = new Date(item.resolved_at!).getTime();
        return sum + Math.max(0, end - start);
      }, 0);
      mttrHours = totalMs / resolvedWithDuration.length / 3600000;
      mttrLabel = mttrHours < 1 ? `${Math.round(mttrHours * 60)} Mnt` : `${mttrHours.toFixed(1)} Jam`;
    }

    const activeTicketsList = shiftFilteredIncidents.filter(
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
      mttr: mttrLabel,
      mttrHours,
      activeTickets: activeTicketsList.length,
      housekeepingAlerts,
      openCount,
      inProgressCount,
      onHoldCount
    };
  }, [data, shiftFilteredIncidents]);

  // Technicians List for assignment dropdown
  const technicians = useMemo(() => {
    if (!data) return [];
    return data.users.filter((u) => u.role === 'TEKNISI' || u.role === 'SUPERVISOR');
  }, [data]);

  // LOGIN SCREEN (Index Twilight Summit Aesthetic)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#04061c] text-white flex flex-col justify-between relative overflow-hidden">
        {/* Subtle Alpine Horizon Dusk Glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-25 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 0%, rgb(2, 229, 239) 0%, rgb(72, 89, 235) 55%, rgba(138, 56, 244, 0) 100%)'
          }}
        />

        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md rounded-[20px] border border-[#292a4d] bg-[#0c0a2b] p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[30px] bg-[#13151f] border border-[#292a4d] text-xs font-medium text-[#b4b4bb] mx-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-[#665eff]" />
                <span>Command Center Telemetry</span>
              </div>
              <h1 className="text-[32px] leading-[1.2] font-semibold font-display tracking-[0.006em] text-white">
                MAINTENIS
              </h1>
              <p className="text-[15px] leading-[1.6] text-[#9b9ba4]">
                Engineering Monitoring & Field Incident System
              </p>
            </div>

            {/* Google SSO Login */}
            <div className="space-y-3 pt-1">
              <span className="text-xs text-[#9b9ba4] block text-center">
                Masuk menggunakan akun Google Workspace
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
              <div className="border-t border-[#202333] w-full" />
              <span className="bg-[#0c0a2b] px-3 text-[11px] text-[#9b9ba4] uppercase tracking-[0.015em] absolute">
                Atau Demo Persona
              </span>
            </div>

            {/* Quick Demo Persona Switcher */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {(['PELAPOR', 'TEKNISI', 'SUPERVISOR', 'ADMIN'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => switchDemoRole(r)}
                    className="p-3 rounded-[12px] border border-[#202333] bg-[#13151f] hover:bg-[#2c2b52]/50 hover:border-[#292a4d] text-left transition-colors flex items-center gap-2.5 group"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#9b9ba4] group-hover:text-white shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-white">
                        {r}
                      </div>
                      <div className="text-[11px] text-[#9b9ba4] truncate">
                        {r === 'PELAPOR'
                          ? 'Operator Lapangan'
                          : r === 'TEKNISI'
                          ? 'Staff Maintenance'
                          : r === 'SUPERVISOR'
                          ? 'Lead Engineer'
                          : 'System Admin'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN OPERATIONAL DASHBOARD (Index Twilight Summit Command Center)
  return (
    <div
      className={`min-h-screen bg-[#04061c] text-white flex flex-col relative ${
        isTvMode ? 'tv-kiosk-mode' : ''
      }`}
    >
      {/* Subtle Twilight Horizon Ambient Glow behind Top Navigation */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 0%, rgb(2, 229, 239) 0%, rgb(72, 89, 235) 65%, rgba(138, 56, 244, 0) 100%)'
        }}
      />

      {/* 1. Floating Frosted Pill Control Bar */}
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

      {/* Main Content Area (1200px Centered Command Grid) */}
      <main className="relative z-10 flex-1 px-3 sm:px-5 pt-6 pb-10 max-w-[1200px] w-full mx-auto space-y-6">
        {/* 2. 4 Core KPI Cards */}
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
              <KpiCard
                title="Equipment Availability"
                value={kpis.availability}
                subtitle="Rasio aset siap operasi vs total aset kritis"
                icon={Activity}
                badge={{
                  text: parseFloat(kpis.availability) >= 90 ? 'Optimal' : 'Watchlist',
                  variant: parseFloat(kpis.availability) >= 90 ? 'positive' : 'warning'
                }}
              />

              <KpiCard
                title="MTTR (Mean Time to Repair)"
                value={kpis.mttr}
                subtitle={
                  selectedShift === 'ALL'
                    ? 'Rata-rata durasi penyelesaian tiket'
                    : `Rata-rata durasi (${selectedShift})`
                }
                icon={Clock}
                badge={{
                  text: kpis.mttrHours > 3 ? 'SLA > 3.0h' : 'SLA < 3.0h',
                  variant: kpis.mttrHours > 3 ? 'critical' : 'positive'
                }}
              />

              <KpiCard
                title="Active Incident Tickets"
                value={kpis.activeTickets}
                subtitle="Antrean perbaikan & penertiban aktif"
                icon={AlertTriangle}
                badge={{
                  text: kpis.activeTickets > 5 ? 'High Load' : 'Nominal',
                  variant: kpis.activeTickets > 5 ? 'critical' : 'neutral'
                }}
                breakdown={[
                  { label: 'Open', count: kpis.openCount, color: 'bg-[#665eff]' },
                  { label: 'Progress', count: kpis.inProgressCount, color: 'bg-[#0067ff]' },
                  { label: 'Hold', count: kpis.onHoldCount, color: 'bg-[#ff3a63]' }
                ]}
              />

              <KpiCard
                title="5R Housekeeping Alerts"
                value={kpis.housekeepingAlerts}
                subtitle="Alat tidak pada tempatnya & hazard rute"
                icon={Wrench}
                badge={{
                  text: kpis.housekeepingAlerts > 0 ? 'Action Needed' : 'Clean',
                  variant: kpis.housekeepingAlerts > 0 ? 'warning' : 'positive'
                }}
              />
            </>
          )}
        </section>

        {/* 3. Critical Asset Watchlist & Ratio Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CriticalAssetWatchlist
            assets={data?.assets || []}
            incidents={shiftFilteredIncidents}
            onSelectAsset={(assetId) => {
              setSelectedAssetId(assetId);
              showToast('Filter Aset Diterapkan', `Menampilkan tiket untuk aset ${assetId}`, 'info');
            }}
          />

          <MaintenanceRatioChart
            incidents={shiftFilteredIncidents}
            assets={data?.assets || []}
          />
        </section>

        {/* 4. Active Ticket Queue */}
        <section>
          <ActiveTicketQueue
            incidents={shiftFilteredIncidents}
            searchQuery={searchQuery}
            selectedShift={selectedShift}
            onClearShiftFilter={() => setSelectedShift('ALL')}
            selectedAssetId={selectedAssetId}
            onClearAssetFilter={() => setSelectedAssetId(null)}
            onSelectTicket={(ticket) => setActiveTicketId(ticket.ticket_id)}
          />
        </section>

        {/* 5. Embedded AI Operational Telemetry Briefing */}
        <section className="tv-hide">
          <AiTelemetryBanner
            briefing={aiBriefing}
            loading={isAiLoading}
            onRefresh={loadAiBriefing}
          />
        </section>
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-[#202333] bg-[#02030b] px-4 py-3.5 text-xs text-[#9b9ba4]">
        <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffff00]" />
            <span className="text-[#b4b4bb] font-medium">MAINTENIS Telemetry Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Gemini 2.5 Flash / Groq Llama 3.3</span>
            <span className="text-[#292a4d]">â€¢</span>
            <span>
              {user?.role || 'Guest'} ({user?.nama_lengkap || '-'})
            </span>
          </div>
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
        onClose={() => setActiveTicketId(null)}
        onUpdateTicket={handleUpdateTicket}
        onFilterByAsset={(astId) => {
          setSelectedAssetId(astId);
          setActiveTicketId(null);
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
