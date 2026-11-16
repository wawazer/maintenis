import React, { useState } from 'react';
import { Bot, Wrench, ShieldAlert, CheckSquare, Clock, Sparkles, RefreshCw } from 'lucide-react';
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
    <div className="rounded-lg border border-cyan-800/40 bg-slate-950/70 p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-200">
              AI Diagnostic & Troubleshooting Suggester
            </h4>
            <p className="text-[11px] text-slate-400">
              Analisis Akar Masalah & Panduan Perbaikan Lapangan
            </p>
          </div>
        </div>

        {!result ? (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menganalisis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analisis Gejala & Saran</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-analisis</span>
          </button>
        )}
      </div>

      {/* Diagnostic Results */}
      {result && (
        <div className="space-y-3.5 pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
          {/* Probable Root Cause */}
          <div className="p-3 rounded bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 uppercase mb-1">
              <Wrench className="w-3.5 h-3.5" />
              <span>Dugaan Akar Masalah (Root Cause):</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {result.probable_root_cause}
            </p>
          </div>

          {/* Safety Precautions (K3) */}
          {result.safety_precautions && result.safety_precautions.length > 0 && (
            <div className="p-3 rounded bg-rose-950/30 border border-rose-800/40">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-300 uppercase mb-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Prosedur Keselamatan Kerja (K3 / LOTO):</span>
              </div>
              <ul className="space-y-1">
                {result.safety_precautions.map((item, idx) => (
                  <li key={idx} className="text-xs text-rose-100 flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactive Step-by-Step Troubleshooting Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Langkah Troubleshooting Terstruktur:
              </span>
              <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
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
                    className={`flex items-start gap-2.5 p-2 rounded cursor-pointer border transition-colors ${
                      isChecked
                        ? 'bg-emerald-950/30 border-emerald-700/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleStep(idx)}
                      className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span
                      className={`text-xs leading-relaxed ${
                        isChecked ? 'line-through opacity-80' : ''
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
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-400 mr-1">
                Peralatan Dibutuhkan:
              </span>
              {result.required_tools.map((tool, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300"
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
