import React from 'react';
import { TicketHistoryLog } from '../../types';
import { Clock, User, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface TicketTimelineProps {
  logs: TicketHistoryLog[];
}

export const TicketTimeline: React.FC<TicketTimelineProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="p-4 text-center text-xs font-mono text-slate-500 border border-slate-800 rounded bg-slate-950/40">
        Belum ada riwayat log audit untuk tiket ini.
      </div>
    );
  }

  // Sort logs by timestamp ascending or descending
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {sortedLogs.map((log) => {
        const dateObj = new Date(log.timestamp);
        const formattedDate = dateObj.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        const formattedTime = dateObj.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <div key={log.log_id} className="relative group">
            {/* Timeline bullet */}
            <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full border-2 border-slate-900 bg-cyan-500 ring-4 ring-slate-950 group-hover:scale-110 transition-transform" />

            <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 space-y-2">
              {/* Header: Status Transition & Timestamp */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  {log.status_sebelum !== 'NONE' && (
                    <>
                      <StatusBadge status={log.status_sebelum} size="sm" showDot={false} />
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                    </>
                  )}
                  <StatusBadge status={log.status_sesudah} size="sm" />
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 tabular-nums">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>
                    {formattedDate} {formattedTime}
                  </span>
                </div>
              </div>

              {/* Actor attribution */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold text-white">{log.aktor_nama}</span>
                <span className="text-[11px] font-mono text-slate-500">
                  ({log.aktor_email})
                </span>
              </div>

              {/* Log Note */}
              {log.catatan_log && (
                <p className="text-xs text-slate-300 bg-slate-950/70 p-2 rounded border border-slate-800/60 leading-relaxed font-sans">
                  {log.catatan_log}
                </p>
              )}

              {/* Photo attachment thumbnail */}
              {log.foto_lampiran_url && (
                <div className="mt-2">
                  <a
                    href={log.foto_lampiran_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Lihat Bukti Foto Terlampir</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
