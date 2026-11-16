import React, { useState } from 'react';
import { Bot, Wrench, ShieldAlert, Clock, Sparkles, RefreshCw } from 'lucide-react';
import { maintenanceApi } from '../../services/maintenanceApi';
import { AiTroubleshootResult, IncidentReport } from '../../types';

interface AiTroubleshootCardProps {
  ticket: IncidentReport;
}

export const AiTroubleshootCard: React.FC<AiTroubleshootCardProps> = ({ ticket }) => {
  const [result, setResult] = useState<AiTroubleshootResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await maintenanceApi.getAiTroubleshootChecklist(ticket.ticket_id);
      setResult(res);
      setCheckedSteps({});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (index: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="rounded-[12px] border border-[#292a4d] bg-[#13151f] p-4 space-y-3.5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-[#0c0a2b] border border-[#292a4d] flex items-center justify-center text-[#665eff] shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[14px] font-display font-semibold tracking-[0.013em] text-white">
              AI Diagnostic & Troubleshooting Suggester
            </h4>
            <p className="text-xs text-[#9b9ba4]">
              Analisis akar masalah & panduan perbaikan lapangan
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[30px] text-xs font-medium bg-[#0c0a2b] border border-[#665eff]/70 hover:bg-[#2c2b52]/60 text-white disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0067ff]" />
              <span>Menganalisis...</span>
            </>
          ) : result ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-[#665eff]" />
              <span>Re-analisis</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#665eff]" />
              <span>Analisis Gejala & Saran</span>
            </>
          )}
        </button>
      </div>

      {/* Diagnostic Results */}
      {result && (
        <div className="space-y-3 pt-3 border-t border-[#202333] animate-in fade-in duration-200">
          {/* Probable Root Cause */}
          <div className="p-3 rounded-[12px] bg-[#0c0a2b] border border-[#202333]">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#b4b4bb] uppercase tracking-[0.015em] mb-1">
              <Wrench className="w-3.5 h-3.5 text-[#0067ff]" />
              <span>Dugaan Akar Masalah (Root Cause)</span>
            </div>
            <p className="text-[13px] text-white leading-[1.55]">
              {result.probable_root_cause}
            </p>
          </div>

          {/* Safety Precautions (K3) */}
          {result.safety_precautions && result.safety_precautions.length > 0 && (
            <div className="p-3 rounded-[12px] bg-[#0c0a2b] border border-[#ff3a63]/50">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-white uppercase tracking-[0.015em] mb-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#ff3a63]" />
                <span>Prosedur Keselamatan Kerja (K3 / LOTO)</span>
              </div>
              <ul className="space-y-1">
                {result.safety_precautions.map((item, idx) => (
                  <li key={idx} className="text-xs text-[#b4b4bb] flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff3a63] mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactive Step-by-Step Troubleshooting Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-[#9b9ba4] uppercase tracking-[0.015em]">
                Langkah Troubleshooting Terstruktur
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-[30px] bg-[#0c0a2b] border border-[#292a4d] text-[#b4b4bb] tabular-nums">
                <Clock className="w-3 h-3 text-[#0067ff]" />
                <span>Est: {result.estimated_resolution_minutes} Menit</span>
              </span>
            </div>
            <div className="space-y-1.5">
              {result.troubleshooting_steps.map((step, idx) => {
                const isChecked = Boolean(checkedSteps[idx]);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-[12px] cursor-pointer border transition-colors ${
                      isChecked
                        ? 'bg-[#2c2b52]/40 border-[#ffff00]/50 text-[#9b9ba4]'
                        : 'bg-[#0c0a2b] border-[#202333] text-[#b4b4bb] hover:border-[#292a4d] hover:text-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleStep(idx)}
                      className="mt-0.5 rounded-[6px] border-[#353545] accent-[#665eff] cursor-pointer"
                    />
                    <span
                      className={`text-xs leading-[1.5] ${
                        isChecked ? 'line-through opacity-75' : ''
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Required Tools */}
          {result.required_tools && result.required_tools.length > 0 && (
            <div className="pt-2.5 border-t border-[#202333] flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-[#9b9ba4] mr-1">
                Peralatan:
              </span>
              {result.required_tools.map((tool, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2.5 py-0.5 rounded-[30px] bg-[#0c0a2b] border border-[#292a4d] text-[#b4b4bb]"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
