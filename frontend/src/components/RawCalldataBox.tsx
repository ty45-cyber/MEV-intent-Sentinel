import React from 'react';
import { Code2, AlertTriangle, CheckCircle } from 'lucide-react';
import type { MevIntentMetrics } from '../hooks/useMevStream';

interface Props {
  metric: MevIntentMetrics | null;
}

const riskColor: Record<string, string> = {
  Low: 'text-emerald-400',
  Medium: 'text-amber-400',
  High: 'text-orange-400',
  Critical: 'text-rose-400',
};

export function RawCalldataBox({ metric }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-full flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
        <Code2 className="w-4 h-4 text-violet-400" />
        Intent Decoder
      </div>

      {metric ? (
        <>
          <Field label="Decoded Intent">
            <p className="text-xs text-emerald-300 font-mono bg-slate-800 rounded p-2 break-all leading-relaxed">
              {metric.decoded_intent_summary || '—'}
            </p>
          </Field>

          <Field label="Target Contract">
            <p className="text-xs text-slate-300 font-mono bg-slate-800 rounded p-2 break-all">
              {metric.target_contract || '—'}
            </p>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800 rounded p-2">
              <p className="text-xs text-slate-500 mb-0.5">Attack Type</p>
              <p className="text-xs font-mono text-rose-400 font-semibold">{metric.attack_type}</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="text-xs text-slate-500 mb-0.5">Risk Level</p>
              <p className={`text-xs font-mono font-semibold flex items-center gap-1 ${riskColor[metric.risk_level] ?? 'text-slate-300'}`}>
                {metric.risk_level === 'Critical' || metric.risk_level === 'High'
                  ? <AlertTriangle className="w-3 h-3" />
                  : <CheckCircle className="w-3 h-3" />}
                {metric.risk_level}
              </p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="text-xs text-slate-500 mb-0.5">Risk Score</p>
              <p className="text-xs font-mono text-amber-400 font-semibold">{Math.round(metric.risk_score * 100)}%</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="text-xs text-slate-500 mb-0.5">Txs Analyzed</p>
              <p className="text-xs font-mono text-cyan-400 font-semibold">{metric.total_txs_analyzed}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
          Awaiting first intent packet...
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      {children}
    </div>
  );
}
