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
    positive: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50',
    warning: 'bg-amber-950/40 text-amber-300 border-amber-700/50',
    critical: 'bg-rose-950/40 text-rose-300 border-rose-700/50',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-4 md:p-5 rounded-lg border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all ${
        onClick ? 'cursor-pointer hover:bg-slate-900/90' : ''
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-medium">
          {title}
        </span>
        <div className="p-1.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Main KPI Value */}
      <div className="flex items-baseline gap-3 my-1">
        <span className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
          {value}
        </span>
        {badge && (
          <span
            className={`text-[11px] font-mono px-1.5 py-0.5 rounded border font-medium tabular-nums ${badgeStyles[badge.variant]}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* Subtitle / Context */}
      {subtitle && (
        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{subtitle}</p>
      )}

      {/* Sub-breakdown if present (e.g. Open / In Progress / Hold) */}
      {breakdown && breakdown.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-3">
          {breakdown.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-[11px] font-mono">{item.label}:</span>
              <span className="font-mono font-semibold text-slate-200 tabular-nums">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
