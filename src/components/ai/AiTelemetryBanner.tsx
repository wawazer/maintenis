import React, { useState } from 'react';
import { Bot, RefreshCw, AlertTriangle, MapPin, CheckCircle } from 'lucide-react';
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
      border: 'border-[#ff3a63]/70',
      dot: 'bg-[#ff3a63]',
      text: 'Critical Attention'
    },
    ELEVATED: {
      border: 'border-[#0067ff]/70',
      dot: 'bg-[#0067ff]',
      text: 'Elevated Vigilance'
    },
    NOMINAL: {
      border: 'border-[#ffff00]/60',
      dot: 'bg-[#ffff00]',
      text: 'Telemetry Nominal'
    }
  };

  const threat = briefing ? threatConfig[briefing.threat_level] : threatConfig.NOMINAL;

  return (
    <div className="rounded-[12px] border border-[#292a4d] bg-[#0c0a2b] p-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 pb-3 border-b border-[#202333]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-[#13151f] border border-[#202333] flex items-center justify-center text-[#665eff]">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-display font-semibold tracking-[0.013em] text-white">
                AI Operational Telemetry Briefing
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-[30px] bg-[#13151f] text-[#b4b4bb] border border-[#292a4d]">
                Gemini 2.5 Flash / Groq Llama 3.3
              </span>
              {briefing?.is_fallback && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-[30px] bg-[#13151f] text-[#b4b4bb] border border-[#665eff]/60">
                  Deterministic Fallback
                </span>
              )}
            </div>
            <p className="text-xs text-[#9b9ba4]">
              Analisis anomali telemetri & aset â€¢ Cache 15 menit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {briefing && (
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-[30px] bg-[#13151f] border text-white ${threat.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${threat.dot}`} />
              {threat.text}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[30px] border border-[#292a4d] bg-[#13151f] text-[#b4b4bb] hover:text-white hover:bg-[#2c2b52]/50 disabled:opacity-50 transition-colors"
            title="Refresh AI Operational Telemetry Analysis"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading || isRefreshing ? 'animate-spin text-[#0067ff]' : ''}`}
            />
            <span>Refresh AI</span>
          </button>
        </div>
      </div>

      {/* Content Area: 3 Structured Insights */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Skeleton className="h-24 w-full rounded-[12px] bg-[#13151f]" />
          <Skeleton className="h-24 w-full rounded-[12px] bg-[#13151f]" />
          <Skeleton className="h-24 w-full rounded-[12px] bg-[#13151f]" />
        </div>
      ) : briefing ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Recurring Failure Alert */}
          <div className="p-3.5 rounded-[12px] bg-[#13151f] border border-[#202333] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-white mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#ff3a63] shrink-0" />
                <span className="text-[11px] font-medium tracking-[0.015em] uppercase text-[#b4b4bb]">
                  Recurring Failure Alert
                </span>
              </div>
              <p className="text-[13px] text-[#b4b4bb] leading-[1.55]">
                {briefing.recurring_failure_alert}
              </p>
            </div>
            <span className="text-[11px] text-[#9b9ba4] mt-2.5">
              SLA Risk Mitigation
            </span>
          </div>

          {/* 2. 5R / Housekeeping Hotspot */}
          <div className="p-3.5 rounded-[12px] bg-[#13151f] border border-[#202333] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-white mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#665eff] shrink-0" />
                <span className="text-[11px] font-medium tracking-[0.015em] uppercase text-[#b4b4bb]">
                  5R Housekeeping Hotspot
                </span>
              </div>
              <p className="text-[13px] text-[#b4b4bb] leading-[1.55]">
                {briefing.housekeeping_hotspot}
              </p>
            </div>
            <span className="text-[11px] text-[#9b9ba4] mt-2.5">
              Safety Hazard & Tool Crib Compliance
            </span>
          </div>

          {/* 3. Actionable Maintenance Recommendation */}
          <div className="p-3.5 rounded-[12px] bg-[#13151f] border border-[#202333] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-white mb-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#0067ff] shrink-0" />
                <span className="text-[11px] font-medium tracking-[0.015em] uppercase text-[#b4b4bb]">
                  Supervisor Action Plan
                </span>
              </div>
              <p className="text-[13px] text-[#b4b4bb] leading-[1.55]">
                {briefing.actionable_recommendation}
              </p>
            </div>
            <span className="text-[11px] text-[#9b9ba4] mt-2.5">
              Shift Tactical Directive
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
