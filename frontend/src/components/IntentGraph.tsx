import React from 'react';
import { Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { MevIntentMetrics } from '../hooks/useMevStream';

interface Props {
  history: MevIntentMetrics[];
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono shadow-xl">
      <p className="text-slate-400 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}{p.name === 'Risk' ? '%' : ' txs'}</strong>
        </p>
      ))}
    </div>
  );
}

export function IntentGraph({ history }: Props) {
  const data = history.map((m) => ({
    time: new Date(m.timestamp_ms).toLocaleTimeString(),
    Risk: Math.round(m.risk_score * 100),
    Txs: m.total_txs_analyzed,
    attack: m.attack_type,
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Activity className="w-4 h-4 text-cyan-400" />
          Risk Score &amp; Tx Volume Timeline
        </div>
        <span className="text-xs text-slate-500 font-mono">{history.length} events</span>
      </div>

      {data.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-slate-600 text-sm">
          Awaiting mempool events...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 9 }} interval="preserveStartEnd" />
            <YAxis yAxisId="risk" domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} unit="%" width={36} />
            <YAxis yAxisId="txs" orientation="right" tick={{ fill: '#475569', fontSize: 9 }} width={30} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }}
              formatter={(value) => <span className="text-slate-400">{value}</span>}
            />
            <Line
              yAxisId="risk"
              type="monotone"
              dataKey="Risk"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#22d3ee' }}
            />
            <Line
              yAxisId="txs"
              type="monotone"
              dataKey="Txs"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#a78bfa' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
