import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  Search,
  Tv,
  PlusCircle,
  Bot,
  Users,
  LogOut,
  ChevronDown,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { maintenanceApi } from '../../services/maintenanceApi';
import { UserRole } from '../../types';

interface TopControlBarProps {
  lastSyncTime: Date | null;
  isSyncing: boolean;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedShift: string;
  onShiftChange: (shift: string) => void;
  isTvMode: boolean;
  onToggleTvMode: () => void;
  onOpenReportModal: () => void;
  onOpenCopilot: () => void;
  onOpenUserManagement: () => void;
}

export const TopControlBar: React.FC<TopControlBarProps> = ({
  lastSyncTime,
  isSyncing,
  onRefresh,
  searchQuery,
  onSearchChange,
  selectedShift,
  onShiftChange,
  isTvMode,
  onToggleTvMode,
  onOpenReportModal,
  onOpenCopilot,
  onOpenUserManagement
}) => {
  const { user, isDemoMode, switchDemoRole, logout, can } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMock = maintenanceApi.isUsingMock();

  // Close role menu on outside click or Escape key
  useEffect(() => {
    if (!showRoleMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowRoleMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showRoleMenu]);

  const roleColors: Record<UserRole, string> = {
    PELAPOR: 'text-sky-300 border-sky-700 bg-sky-950/40',
    TEKNISI: 'text-amber-300 border-amber-700 bg-amber-950/40',
    SUPERVISOR: 'text-emerald-300 border-emerald-700 bg-emerald-950/40',
    ADMIN: 'text-purple-300 border-purple-700 bg-purple-950/40'
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-3 sm:px-5 py-2.5">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Branding & Live Sync */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm tracking-wider">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold font-mono tracking-tight uppercase text-white">
                  MAINTENIS
                </h1>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isMock
                      ? 'bg-amber-950/50 text-amber-300 border-amber-800/60'
                      : 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                  }`}
                  title={
                    isMock
                      ? 'Berjalan dalam Local Demo Storage (VITE_GAS_API_URL belum dikonfigurasi)'
                      : 'Terhubung langsung ke Google Sheets Apps Script'
                  }
                >
                  {isMock ? 'LOCAL SANDBOX' : 'LIVE SHEETS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Industrial Engineering & Incident Telemetry
              </p>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Sync Status Badge */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              title="Manual refresh telemetry (auto-polls setiap 30 detik)"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`}
              />
              <span className="hidden md:inline">
                {isSyncing ? 'Syncing...' : 'Sync 30s'}
              </span>
            </button>
            {lastSyncTime && (
              <span className="text-[11px] font-mono text-slate-500 tabular-nums hidden xl:inline">
                {lastSyncTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            )}
          </div>
        </div>

        {/* Center: Shift Filter & Search (Hidden in TV Mode for cleaner display) */}
        <div className="tv-hide flex items-center gap-2 order-3 lg:order-2 w-full lg:w-auto lg:flex-1 lg:max-w-lg">
          {/* Shift Selector */}
          <div className="relative shrink-0">
            <select
              aria-label="Filter Shift Operasional"
              value={selectedShift}
              onChange={(e) => onShiftChange(e.target.value)}
              className={`appearance-none border rounded px-2.5 py-1.5 pr-7 text-xs font-mono focus:outline-none cursor-pointer transition-colors ${
                selectedShift !== 'ALL'
                  ? 'bg-cyan-950/50 border-cyan-700 text-cyan-200 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-200 focus:border-slate-700'
              }`}
            >
              <option value="ALL">Semua Shift</option>
              <option value="Shift 1 (Pagi)">Shift 1 (06-14)</option>
              <option value="Shift 2 (Sore)">Shift 2 (14-22)</option>
              <option value="Shift 3 (Malam)">Shift 3 (22-06)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari tiket, ID aset, lokasi, pelapor..."
              className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions, AI Copilot, User Profile */}
        <div className="flex items-center gap-2 order-2 lg:order-3">
          {/* TV / Kiosk Mode Toggle */}
          <button
            onClick={onToggleTvMode}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-xs font-mono transition-colors ${
              isTvMode
                ? 'bg-emerald-950 border-emerald-600 text-emerald-300 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle TV / Kiosk Display Mode (High Visibility)"
          >
            <Tv className="w-4 h-4" />
            {isTvMode && <span className="text-[11px]">TV ON</span>}
          </button>

          {/* AI Copilot Button */}
          <button
            onClick={onOpenCopilot}
            className="tv-hide flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900 hover:text-cyan-100 text-xs font-mono font-medium transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI Copilot</span>
          </button>

          {/* Manage Users (Supervisor & Admin) */}
          {can('MANAGE_USERS') && (
            <button
              onClick={onOpenUserManagement}
              className="tv-hide p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Kelola Pengguna & Hak Akses"
            >
              <Users className="w-4 h-4" />
            </button>
          )}

          {/* Fast Field Reporting Button (Primary CTA) */}
          <button
            onClick={onOpenReportModal}
            className="tv-hide flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-colors shadow-sm shadow-emerald-950/50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lapor Lapangan</span>
          </button>

          {/* User Profile & Demo Role Switcher */}
          {user && (
            <div className="relative tv-hide" ref={menuRef}>
              <button
                onClick={() => setShowRoleMenu((prev) => !prev)}
                aria-expanded={showRoleMenu}
                className="flex items-center gap-2 p-1 pl-1.5 rounded border border-slate-800 bg-slate-900 hover:border-slate-700 transition-colors"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.nama_lengkap}
                    className="w-6 h-6 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-mono text-white">
                    {user.nama_lengkap[0]}
                  </div>
                )}
                <div className="text-left hidden xl:block">
                  <div className="text-xs font-medium text-slate-200 line-clamp-1 max-w-[110px]">
                    {user.nama_lengkap}
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[9px] font-mono px-1 py-0.2 rounded border uppercase font-bold ${
                        roleColors[user.role]
                      }`}
                    >
                      {user.role}
                    </span>
                    {isDemoMode && (
                      <span className="text-[9px] font-mono text-amber-400">DEMO</span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Quick Role Switcher Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-xs animate-in fade-in">
                  <div className="px-3 py-1.5 border-b border-slate-800">
                    <p className="font-semibold text-white">{user.nama_lengkap}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {user.unit_kerja} â€¢ {user.shift || 'Normal Day'}
                    </p>
                  </div>

                  {/* Switch Demo Role Section */}
                  <div className="px-3 py-2 border-b border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                      Switch Role (Testing RBAC):
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['PELAPOR', 'TEKNISI', 'SUPERVISOR', 'ADMIN'] as UserRole[]).map(
                        (r) => (
                          <button
                            key={r}
                            onClick={() => {
                              switchDemoRole(r);
                              setShowRoleMenu(false);
                            }}
                            className={`px-2 py-1 rounded text-left font-mono text-[10px] border transition-colors ${
                              user.role === r
                                ? 'bg-slate-800 border-slate-600 text-white font-bold'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            {r}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Logout Button */}
                  <div className="px-1 pt-1">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-400 hover:bg-rose-950/30 rounded text-left transition-colors font-mono"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
