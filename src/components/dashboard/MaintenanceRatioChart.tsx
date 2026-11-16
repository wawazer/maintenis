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
  const breakdownCount = incidents.filter((i) => i.kategori_laporan === 'KERUSAKAN').length;
  const housekeepingCount = incidents.filter(
    (i) => i.kategori_laporan === 'ALAT_TIDAK_PADA_TEMPATNYA'
  ).length;

  const pieData = [
    { name: 'Corrective (Kerusakan)', value: breakdownCount, color: '#ff3a63' },
    { name: '5R Housekeeping', value: housekeepingCount, color: '#665eff' }
  ].filter((d) => d.value > 0);

  const fallbackPieData = [{ name: 'Belum Ada Tiket', value: 1, color: '#202333' }];
  const activePieData = pieData.length > 0 ? pieData : fallbackPieData;

  const urgencyData = [
    {
      level: 'Critical',
      count: incidents.filter((i) => i.urgensi === 'Critical').length,
      fill: '#ff3a63'
    },
    {
      level: 'Urgent',
      count: incidents.filter((i) => i.urgensi === 'Urgent').length,
      fill: '#0067ff'
    },
    {
      level: 'Normal',
      count: incidents.filter((i) => i.urgensi === 'Normal').length,
      fill: '#665eff'
    }
  ];

  const readyAssetsCount = assets.filter((a) => a.status_operasional === 'Ready').length;

  return (
    <div className="rounded-[12px] border border-[#292a4d] bg-[#0c0a2b] p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[15px] font-display font-semibold tracking-[0.013em] text-white">
            Maintenance & Telemetry Ratio
          </h3>
          <p className="text-xs text-[#9b9ba4]">
            Komposisi kategori tiket & distribusi urgensi
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-[30px] bg-[#13151f] text-white border border-[#ffff00]/60 font-medium tabular-nums">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffff00]" />
          {readyAssetsCount}/{assets.length} Ready
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-48">
        {/* Pie Breakdown */}
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
                stroke="#0c0a2b"
                strokeWidth={2}
              >
                {activePieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              {pieData.length > 0 && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#13151f',
                    borderColor: '#292a4d',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#ffffff'
                  }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-semibold font-display text-white tabular-nums">
              {incidents.length}
            </span>
            <span className="text-[11px] text-[#9b9ba4]">
              Total Tiket
            </span>
          </div>
        </div>

        {/* Urgency Bar Chart */}
        <div className="flex flex-col justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={urgencyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#202333" vertical={false} />
              <XAxis
                dataKey="level"
                stroke="#9b9ba4"
                tick={{ fontSize: 11, fill: '#b4b4bb' }}
                axisLine={{ stroke: '#202333' }}
                tickLine={false}
              />
              <YAxis
                stroke="#9b9ba4"
                tick={{ fontSize: 11, fill: '#9b9ba4' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: '#13151f' }}
                contentStyle={{
                  backgroundColor: '#13151f',
                  borderColor: '#292a4d',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#ffffff'
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {urgencyData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="mt-3 pt-2.5 border-t border-[#202333] flex flex-wrap items-center justify-around gap-2 text-xs text-[#b4b4bb]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ff3a63]" />
          <span className="tabular-nums">
            Corrective: <strong className="text-white font-medium">{breakdownCount}</strong> (
            {incidents.length > 0 ? Math.round((breakdownCount / incidents.length) * 100) : 0}%)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#665eff]" />
          <span className="tabular-nums">
            5R Housekeeping: <strong className="text-white font-medium">{housekeepingCount}</strong> (
            {incidents.length > 0 ? Math.round((housekeepingCount / incidents.length) * 100) : 0}%)
          </span>
        </div>
      </div>
    </div>
  );
};
