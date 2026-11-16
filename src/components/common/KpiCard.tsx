import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'positive' | 'warning' | 'critical' | 'neutral';
  };
  breakdown?: Array<{
    label: string;
    count: number;
    color: string;
  }>;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  breakdown,
  onClick
}) => {
  const badgeStyles = {
    positive: 'border-[#ffff00]/60 text-white dot-[#ffff00]',
    warning: 'border-[#0067ff]/70 text-white dot-[#0067ff]',
    critical: 'border-[#ff3a63]/80 text-white dot-[#ff3a63]',
    neutral: 'border-[#292a4d] text-[#b4b4bb] dot-[#9b9ba4]'
  };

  const dotColors = {
    positive: 'bg-[#ffff00]',
    warning: 'bg-[#0067ff]',
    critical: 'bg-[#ff3a63]',
    neutral: 'bg-[#9b9ba4]'
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-[12px] border border-[#292a4d] bg-[#0c0a2b] transition-colors ${
        onClick ? 'cursor-pointer hover:bg-[#2c2b52]/40' : ''
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] uppercase tracking-[0.015em] text-[#9b9ba4] font-medium">
          {title}
        </span>
        <div className="w-7 h-7 rounded-[6px] bg-[#13151f] border border-[#202333] flex items-center justify-center text-[#b4b4bb]">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Main KPI Value */}
      <div className="flex items-center justify-between gap-2 my-1">
        <span className="text-2xl md:text-[32px] leading-[1.2] font-semibold font-display tracking-[0.006em] text-white tabular-nums">
          {value}
        </span>
        {badge && (
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-[30px] bg-[#13151f] border font-medium tabular-nums ${badgeStyles[badge.variant]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dotColors[badge.variant]}`} />
            {badge.text}
          </span>
        )}
      </div>

      {/* Subtitle / Context */}
      {subtitle && (
        <p className="text-xs text-[#9b9ba4] mt-1.5 line-clamp-1">{subtitle}</p>
      )}

      {/* Sub-breakdown if present */}
      {breakdown && breakdown.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#202333] flex items-center gap-3">
          {breakdown.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs text-[#9b9ba4]">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-[11px]">{item.label}:</span>
              <span className="font-semibold text-white tabular-nums">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
