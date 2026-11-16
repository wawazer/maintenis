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
      <div className="p-4 text-center text-xs text-[#9b9ba4] border border-[#202333] rounded-[12px] bg-[#13151f]">
        Belum ada riwayat log audit untuk tiket ini.
      </div>
    );
  }

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-[#292a4d]">
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
            {/* Timeline node dot (Arc Violet) */}
            <div className="absolute -left-[21px] mt-1.5 w-2.5 h-2.5 rounded-full bg-[#665eff] ring-4 ring-[#0c0a2b]" />

            <div className="rounded-[12px] border border-[#202333] bg-[#13151f] p-3.5 space-y-2">
              {/* Header: Status Transition & Timestamp */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  {log.status_sebelum !== 'NONE' && (
                    <>
                      <StatusBadge status={log.status_sebelum} size="sm" showDot={false} />
                      <ArrowRight className="w-3 h-3 text-[#9b9ba4]" />
                    </>
                  )}
                  <StatusBadge status={log.status_sesudah} size="sm" />
                </div>

                <div className="flex items-center gap-1 text-[11px] text-[#9b9ba4] tabular-nums">
                  <Clock className="w-3 h-3 text-[#9b9ba4]" />
                  <span>
                    {formattedDate} {formattedTime}
                  </span>
                </div>
              </div>

              {/* Actor attribution */}
              <div className="flex items-center gap-1.5 text-xs text-[#b4b4bb]">
                <User className="w-3.5 h-3.5 text-[#9b9ba4] shrink-0" />
                <span className="font-medium text-white">{log.aktor_nama}</span>
                <span className="text-[11px] text-[#9b9ba4]">({log.aktor_email})</span>
              </div>

              {/* Log Note */}
              {log.catatan_log && (
                <p className="text-[13px] text-[#b4b4bb] bg-[#0c0a2b] p-2.5 rounded-[12px] border border-[#202333] leading-[1.5]">
                  {log.catatan_log}
                </p>
              )}

              {/* Photo attachment link */}
              {log.foto_lampiran_url && (
                <div className="pt-0.5">
                  <a
                    href={log.foto_lampiran_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#0067ff] hover:text-white transition-colors"
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
