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
  // Index Design Tokens: Pill shape (30px), #0c0a2b fill, 1px border in matching saturated color, 6px dot
  // Electric Blue (#0067ff) = in-progress / active
  // Arc Violet (#665eff) = planned / assigned / submitted
  // Ember Coral (#ff3a63) = blocked / breakdown / critical
  // Chartreuse (#ffff00) = done / ready / resolved

  let borderClass = 'border-[#292a4d]';
  let dotStyle = 'bg-[#9b9ba4]';
  let textClass = 'text-[#b4b4bb]';
  let label = status;

  switch (status) {
    // Ticket Statuses
    case 'SUBMITTED':
      borderClass = 'border-[#665eff]/60';
      dotStyle = 'bg-[#665eff]';
      textClass = 'text-white';
      label = 'Submitted';
      break;
    case 'ASSIGNED':
      borderClass = 'border-[#665eff]/80';
      dotStyle = 'bg-[#665eff]';
      textClass = 'text-white';
      label = 'Assigned';
      break;
    case 'IN_PROGRESS':
      borderClass = 'border-[#0067ff]/80';
      dotStyle = 'bg-[#0067ff] animate-pulse';
      textClass = 'text-white';
      label = 'In Progress';
      break;
    case 'ON_HOLD':
      borderClass = 'border-[#ff3a63]/60';
      dotStyle = 'bg-[#ff3a63]';
      textClass = 'text-[#b4b4bb]';
      label = 'On Hold';
      break;
    case 'RESOLVED':
      borderClass = 'border-[#ffff00]/70';
      dotStyle = 'bg-[#ffff00]';
      textClass = 'text-white';
      label = 'Resolved';
      break;
    case 'CLOSED':
      borderClass = 'border-[#292a4d]';
      dotStyle = 'bg-[#9b9ba4]';
      textClass = 'text-[#9b9ba4]';
      label = 'Closed';
      break;

    // Asset Statuses
    case 'Ready':
      borderClass = 'border-[#ffff00]/70';
      dotStyle = 'bg-[#ffff00]';
      textClass = 'text-white';
      label = 'Ready';
      break;
    case 'Breakdown':
      borderClass = 'border-[#ff3a63]/90';
      dotStyle = 'bg-[#ff3a63] animate-pulse';
      textClass = 'text-white';
      label = 'Breakdown';
      break;
    case 'Maintenance':
      borderClass = 'border-[#0067ff]/80';
      dotStyle = 'bg-[#0067ff]';
      textClass = 'text-white';
      label = 'Maintenance';
      break;

    // Urgency Levels
    case 'Critical':
      borderClass = 'border-[#ff3a63]/90';
      dotStyle = 'bg-[#ff3a63]';
      textClass = 'text-white';
      label = 'Critical';
      break;
    case 'Urgent':
      borderClass = 'border-[#0067ff]/80';
      dotStyle = 'bg-[#0067ff]';
      textClass = 'text-white';
      label = 'Urgent';
      break;
    case 'Normal':
      borderClass = 'border-[#292a4d]';
      dotStyle = 'bg-[#9b9ba4]';
      textClass = 'text-[#b4b4bb]';
      label = 'Normal';
      break;

    // Categories
    case 'KERUSAKAN':
      borderClass = 'border-[#ff3a63]/60';
      dotStyle = 'bg-[#ff3a63]';
      textClass = 'text-[#b4b4bb]';
      label = 'Kerusakan';
      break;
    case 'ALAT_TIDAK_PADA_TEMPATNYA':
      borderClass = 'border-[#665eff]/60';
      dotStyle = 'bg-[#665eff]';
      textClass = 'text-[#b4b4bb]';
      label = '5R Housekeeping';
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[30px] bg-[#0c0a2b] border font-medium tracking-[0.012em] tabular-nums ${borderClass} ${textClass} ${sizeClasses}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle}`} />}
      {label}
    </span>
  );
};
