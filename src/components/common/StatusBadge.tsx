import React from 'react';
import { TicketStatus, AssetOperationalStatus, UrgencyLevel, TicketCategory } from '../../types';

interface StatusBadgeProps {
  status: TicketStatus | AssetOperationalStatus | UrgencyLevel | TicketCategory | string;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true
}) => {
  // Semantic Color Palette (Anti-Slop Industrial Rules)
  // Emerald: Ready, Resolved
  // Amber: In Progress, Assigned, 5R Housekeeping, Urgent
  // Rose: Breakdown, Critical
  // Slate: Neutral, Closed, Normal
  // Sky/Cyan: Submitted, Telemetry

  let bgClass = 'bg-slate-900/60 border-slate-700 text-slate-300';
  let dotClass = 'bg-slate-400';
  let label = status;

  switch (status) {
    // Ticket Statuses
    case 'SUBMITTED':
      bgClass = 'bg-sky-950/40 border-sky-600/50 text-sky-300';
      dotClass = 'bg-sky-400 animate-pulse';
      label = 'SUBMITTED';
      break;
    case 'ASSIGNED':
      bgClass = 'bg-amber-950/40 border-amber-600/50 text-amber-300';
      dotClass = 'bg-amber-400';
      label = 'ASSIGNED';
      break;
    case 'IN_PROGRESS':
      bgClass = 'bg-amber-950/40 border-amber-500/60 text-amber-300';
      dotClass = 'bg-amber-400 animate-pulse';
      label = 'IN PROGRESS';
      break;
    case 'ON_HOLD':
      bgClass = 'bg-orange-950/40 border-orange-600/50 text-orange-300';
      dotClass = 'bg-orange-400';
      label = 'ON HOLD';
      break;
    case 'RESOLVED':
      bgClass = 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300';
      dotClass = 'bg-emerald-400';
      label = 'RESOLVED';
      break;
    case 'CLOSED':
      bgClass = 'bg-slate-900/80 border-slate-700 text-slate-400';
      dotClass = 'bg-slate-500';
      label = 'CLOSED';
      break;

    // Asset Statuses
    case 'Ready':
      bgClass = 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300';
      dotClass = 'bg-emerald-400';
      label = 'READY';
      break;
    case 'Breakdown':
      bgClass = 'bg-rose-950/50 border-rose-600/60 text-rose-300';
      dotClass = 'bg-rose-500 animate-pulse';
      label = 'BREAKDOWN';
      break;
    case 'Maintenance':
      bgClass = 'bg-amber-950/40 border-amber-600/50 text-amber-300';
      dotClass = 'bg-amber-400';
      label = 'MAINTENANCE';
      break;

    // Urgency Levels
    case 'Critical':
      bgClass = 'bg-rose-950/50 border-rose-600/70 text-rose-300';
      dotClass = 'bg-rose-500 animate-pulse';
      label = 'CRITICAL';
      break;
    case 'Urgent':
      bgClass = 'bg-amber-950/40 border-amber-600/60 text-amber-300';
      dotClass = 'bg-amber-400';
      label = 'URGENT';
      break;
    case 'Normal':
      bgClass = 'bg-slate-800/60 border-slate-700 text-slate-300';
      dotClass = 'bg-slate-400';
      label = 'NORMAL';
      break;

    // Categories
    case 'KERUSAKAN':
      bgClass = 'bg-rose-950/30 border-rose-800/40 text-rose-300';
      dotClass = 'bg-rose-400';
      label = 'KERUSAKAN';
      break;
    case 'ALAT_TIDAK_PADA_TEMPATNYA':
      bgClass = 'bg-amber-950/30 border-amber-800/40 text-amber-300';
      dotClass = 'bg-amber-400';
      label = '5R HOUSEKEEPING';
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider font-semibold rounded border ${bgClass} ${sizeClasses} tabular-nums`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />}
      {label}
    </span>
  );
};
