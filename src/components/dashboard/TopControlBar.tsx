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

  const roleDotColors: Record<UserRole, string> = {
    PELAPOR: 'bg-[#0067ff]',
    TEKNISI: 'bg-[#665eff]',
    SUPERVISOR: 'bg-[#ffff00]',
    ADMIN: 'bg-[#ff3a63]'
  };

  return (
    <header className="sticky top-3 z-30 px-3 sm:px-5">
      {/* Frosted Floating Pill Nav Bar (Index Style Reference) */}
      <div className="max-w-[1200px] mx-auto rounded-[30px] border border-[#292a4d] bg-[#0c0a2b]/80 backdrop-blur-md px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Brand Identity & Live Telemetry Status */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[30px] alpine-horizon-line p-[1px] shrink-0">
              <div className="w-full h-full rounded-[30px] bg-[#0c0a2b] flex items-center justify-center font-display font-semibold text-white text-sm">
                M
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold font-display tracking-[0.012em] text-white">
                  MAINTENIS
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-[30px] bg-[#13151f] border border-[#292a4d] text-[#b4b4bb] font-medium"
                  title={
                    isMock
                      ? 'Berjalan dalam Local Demo Storage (VITE_GAS_API_URL belum dikonfigurasi)'
                      : 'Terhubung langsung ke Google Sheets Apps Script'
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isMock ? 'bg-[#665eff]' : 'bg-[#ffff00]'
                    }`}
                  />
                  {isMock ? 'Sandbox' : 'Live Sheets'}
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-[#202333] hidden sm:block" />

          {/* Sync Pill */}
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[30px] bg-[#13151f] border border-[#202333] hover:border-[#292a4d] text-[#b4b4bb] hover:text-white transition-colors disabled:opacity-50"
            title="Sinkronisasi manual (auto-poll 30s)"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#0067ff]' : 'text-[#9b9ba4]'}`}
            />
            <span className="hidden md:inline tabular-nums">
              {isSyncing
                ? 'Syncing'
                : lastSyncTime
                ? lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '30s'}
            </span>
          </button>
        </div>

        {/* Center: Shift Filter & Search Pills */}
        <div className="tv-hide flex items-center gap-2 order-3 lg:order-2 w-full lg:w-auto lg:flex-1 lg:max-w-md">
          <div className="relative shrink-0">
            <select
              aria-label="Filter Shift Operasional"
              value={selectedShift}
              onChange={(e) => onShiftChange(e.target.value)}
              className={`appearance-none rounded-[30px] border px-3 py-1.5 pr-7 text-xs font-medium focus:outline-none cursor-pointer transition-colors ${
                selectedShift !== 'ALL'
                  ? 'bg-[#2c2b52] border-[#665eff] text-white'
                  : 'bg-[#13151f] border-[#292a4d] text-[#b4b4bb] hover:text-white'
              }`}
            >
              <option value="ALL">Semua Shift</option>
              <option value="Shift 1 (Pagi)">Shift 1 (06â€“14)</option>
              <option value="Shift 2 (Sore)">Shift 2 (14â€“22)</option>
              <option value="Shift 3 (Malam)">Shift 3 (22â€“06)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#9b9ba4] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#9b9ba4] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari tiket, aset, lokasi..."
              className="w-full bg-[#13151f] border border-[#292a4d] focus:border-[#665eff] rounded-[30px] pl-8 pr-7 py-1.5 text-xs text-white placeholder-[#9b9ba4] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9b9ba4] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Secondary Ghost/Pill Controls + Exclusive Coral Primary CTA */}
        <div className="flex items-center gap-2 order-2 lg:order-3">
          <button
            onClick={onToggleTvMode}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[30px] border text-xs font-medium transition-colors ${
              isTvMode
                ? 'bg-[#2c2b52] border-[#665eff] text-white'
                : 'bg-[#13151f] border-[#202333] text-[#9b9ba4] hover:text-white hover:border-[#292a4d]'
            }`}
            title="TV / Kiosk Display Mode"
          >
            <Tv className="w-3.5 h-3.5" />
            {isTvMode && <span className="text-[11px]">TV</span>}
          </button>

          <button
            onClick={onOpenCopilot}
            className="tv-hide inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[30px] bg-[#13151f] border border-[#292a4d] hover:bg-[#2c2b52]/60 text-[#b4b4bb] hover:text-white text-xs font-medium transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-[#665eff]" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {can('MANAGE_USERS') && (
            <button
              onClick={onOpenUserManagement}
              className="tv-hide p-1.5 rounded-[30px] bg-[#13151f] border border-[#202333] hover:border-[#292a4d] text-[#9b9ba4] hover:text-white transition-colors"
              title="Kelola Pengguna & Hak Akses"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Exclusive Coral-to-Red Primary CTA */}
          <button
            onClick={onOpenReportModal}
            className="tv-hide btn-coral-cta inline-flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-[13px]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Lapor Insiden</span>
          </button>

          {/* User Profile Pill */}
          {user && (
            <div className="relative tv-hide" ref={menuRef}>
              <button
                onClick={() => setShowRoleMenu((prev) => !prev)}
                aria-expanded={showRoleMenu}
                className="flex items-center gap-2 p-1 pr-2.5 rounded-[30px] border border-[#292a4d] bg-[#13151f] hover:bg-[#2c2b52]/50 transition-colors"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.nama_lengkap}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#2c2b52] flex items-center justify-center text-xs font-medium text-white">
                    {user.nama_lengkap[0]}
                  </div>
                )}
                <span className={`w-1.5 h-1.5 rounded-full ${roleDotColors[user.role]}`} />
                <span className="text-xs font-medium text-white hidden xl:inline max-w-[96px] truncate">
                  {user.role}
                </span>
                <ChevronDown className="w-3 h-3 text-[#9b9ba4]" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-[12px] bg-[#0c0a2b] border border-[#292a4d] py-2 z-50 text-xs">
                  <div className="px-3.5 py-2 border-b border-[#202333]">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-white truncate">{user.nama_lengkap}</p>
                      {isDemoMode && (
                        <span className="text-[10px] px-2 py-0.5 rounded-[30px] bg-[#13151f] border border-[#292a4d] text-[#b4b4bb]">
                          Demo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#9b9ba4] mt-0.5">{user.email}</p>
                    <p className="text-[11px] text-[#9b9ba4] mt-0.5">
                      {user.unit_kerja} â€¢ {user.shift || 'Normal Day'}
                    </p>
                  </div>

                  <div className="px-3.5 py-2.5 border-b border-[#202333]">
                    <span className="text-[11px] text-[#9b9ba4] block mb-2">
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
                            className={`px-2.5 py-1 rounded-[30px] text-center text-[11px] border transition-colors ${
                              user.role === r
                                ? 'bg-[#2c2b52] border-[#665eff] text-white font-medium'
                                : 'bg-[#13151f] border-[#202333] text-[#9b9ba4] hover:text-white'
                            }`}
                          >
                            {r}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="px-2 pt-1.5">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[#ff3a63] hover:bg-[#13151f] rounded-[30px] text-left transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar</span>
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
