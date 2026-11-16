import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { IncidentReport, AssetMaster } from '../../types';

interface MaintenanceRatioChartProps {
  incidents: IncidentReport[];
  assets: AssetMaster[];
}

export const MaintenanceRatioChart: React.FC<MaintenanceRatioChartProps> = ({
  incidents,
  assets
}) => {
  // Ticket-only category breakdown (ensures center Total Tiket matches sum of slices)
  const breakdownCount = incidents.filter((i) => i.kategori_laporan === 'KERUSAKAN').length;
  const housekeepingCount = incidents.filter(
    (i) => i.kategori_laporan === 'ALAT_TIDAK_PADA_TEMPATNYA'
  ).length;

  const pieData = [
    { name: 'Corrective (Kerusakan)', value: breakdownCount, color: '#f43f5e' },
    { name: '5R Housekeeping', value: housekeepingCount, color: '#f59e0b' }
  ].filter((d) => d.value > 0);

  const fallbackPieData = [{ name: 'Belum Ada Tiket', value: 1, color: '#1e293b' }];
  const activePieData = pieData.length > 0 ? pieData : fallbackPieData;

  // Distribution by Urgency
  const urgencyData = [
    {
      level: 'Critical',
      count: incidents.filter((i) => i.urgensi === 'Critical').length,
      fill: '#f43f5e'
    },
    {
      level: 'Urgent',
      count: incidents.filter((i) => i.urgensi === 'Urgent').length,
      fill: '#f59e0b'
    },
    {
      level: 'Normal',
      count: incidents.filter((i) => i.urgensi === 'Normal').length,
      fill: '#0284c7'
    }
  ];

  const readyAssetsCount = assets.filter((a) => a.status_operasional === 'Ready').length;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
            Maintenance & Telemetry Ratio
          </h3>
          <p className="text-[11px] text-slate-500 font-mono">
            Komposisi Kategori Tiket & Distribusi Urgensi
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {readyAssetsCount}/{assets.length} Aset Ready
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-48">
        {/* Pie Breakdown (Tickets Only) */}
        <div className="relative flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={activePieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={58}
                paddingAngle={pieData.length > 1 ? 4 : 0}
                stroke="#0f172a"
                strokeWidth={2}
              >
                {activePieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              {pieData.length > 0 && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#fff',
                    fontFamily: 'monospace'
                  }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold font-mono text-white tabular-nums">
              {incidents.length}
            </span>
            <span className="text-[9px] font-mono text-slate-400 uppercase">
              Total Tiket
            </span>
          </div>
        </div>

        {/* Urgency Bar Chart */}
        <div className="flex flex-col justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={urgencyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="level"
                stroke="#64748b"
                tick={{ fontSize: 10, fontFamily: 'monospace' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fontFamily: 'monospace' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#fff',
                  fontFamily: 'monospace'
                }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {urgencyData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-around gap-2 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>
            Corrective: {breakdownCount} (
            {incidents.length > 0 ? Math.round((breakdownCount / incidents.length) * 100) : 0}%)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>
            5R Housekeeping: {housekeepingCount} (
            {incidents.length > 0 ? Math.round((housekeepingCount / incidents.length) * 100) : 0}%)
          </span>
        </div>
      </div>
    </div>
  );
};
