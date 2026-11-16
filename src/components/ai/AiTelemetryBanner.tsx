import React, { useState } from 'react';
import { Bot, RefreshCw, AlertTriangle, Sparkles, MapPin, CheckCircle } from 'lucide-react';
import { AiTelemetryBriefing } from '../../types';
import { Skeleton } from '../common/SkeletonLoader';

interface AiTelemetryBannerProps {
  briefing: AiTelemetryBriefing | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export const AiTelemetryBanner: React.FC<AiTelemetryBannerProps> = ({
  briefing,
  loading,
  onRefresh
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const threatConfig = {
    CRITICAL: {
      border: 'border-rose-500/40 bg-rose-950/20',
      badge: 'bg-rose-900/60 text-rose-300 border-rose-600/50',
      text: 'CRITICAL ATTENTION'
    },
    ELEVATED: {
      border: 'border-amber-500/40 bg-amber-950/20',
      badge: 'bg-amber-900/60 text-amber-300 border-amber-600/50',
      text: 'ELEVATED VIGILANCE'
    },
    NOMINAL: {
      border: 'border-cyan-500/30 bg-cyan-950/15',
      badge: 'bg-cyan-900/60 text-cyan-300 border-cyan-600/50',
      text: 'TELEMETRY NOMINAL'
    }
  };

  const threat = briefing ? threatConfig[briefing.threat_level] : threatConfig.NOMINAL;

  return (
    <div
      className={`relative rounded-lg border p-4 md:p-5 transition-all ${threat.border} backdrop-blur-sm`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-700/50">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-200">
                AI Operational Telemetry Briefing
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Gemini 2.5 Flash / Groq Llama 3.3
              </span>
              {briefing?.is_fallback && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-amber-400 border border-amber-800/60">
                  Deterministic Fallback
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Analisis Anomali Sheet & Aset • Cache 15 Menit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {briefing && (
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${threat.badge}`}
            >
              {threat.text}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-600 disabled:opacity-50 transition-colors"
            title="Refresh AI Operational Telemetry Analysis"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading || isRefreshing ? 'animate-spin text-cyan-400' : ''}`}
            />
            <span>Refresh AI</span>
          </button>
        </div>
      </div>

      {/* Content Area: 3 Structured Insights in Bahasa Indonesia */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : briefing ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 1. Recurring Failure Alert */}
          <div className="p-3 rounded-md bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-rose-400 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
                  Recurring Failure Alert
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {briefing.recurring_failure_alert}
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 mt-2">
              SLA Risk Mitigation
            </span>
          </div>

          {/* 2. 5R / Housekeeping Hotspot */}
          <div className="p-3 rounded-md bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-amber-400 mb-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
                  5R Housekeeping Hotspot
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {briefing.housekeeping_hotspot}
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 mt-2">
              Safety Hazard & Tool Crib Compliance
            </span>
          </div>

          {/* 3. Actionable Maintenance Recommendation */}
          <div className="p-3 rounded-md bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-cyan-400 mb-1.5">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
                  Supervisor Action Plan
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {briefing.actionable_recommendation}
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 mt-2">
              Shift Tactical Directive
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
