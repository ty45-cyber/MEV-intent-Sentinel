import React from 'react';
import { Zap, DollarSign, Layers } from 'lucide-react';
import type { ParitokStats } from '../hooks/useMevStream';

interface Cumulative {
  tokensSaved: number;
  costSaved: number;
  txsProcessed: number;
}

interface Props {
  stats: ParitokStats;
  cumulativeSavings: Cumulative;
}

export function ParitokStatsWidget({ stats, cumulativeSavings }: Props) {
  const compressionRatio = stats.raw_prompt_tokens > 0
    ? Math.round((1 - stats.compressed_tokens / stats.raw_prompt_tokens) * 100)
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-300">
        <Zap className="w-4 h-4 text-cyan-400" />
        Paritok Token-Efficiency Engine
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Layers className="w-4 h-4 text-violet-400" />}
          label="Raw Tokens"
          value={stats.raw_prompt_tokens.toString()}
          sub="per intent"
        />
        <StatCard
          icon={<Zap className="w-4 h-4 text-cyan-400" />}
          label="Compressed"
          value={stats.compressed_tokens.toString()}
          sub={`${compressionRatio}% reduction`}
          highlight
        />
        <StatCard
          icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
          label="Cost Saved (session)"
          value={`$${cumulativeSavings.costSaved.toFixed(4)}`}
          sub={`${cumulativeSavings.txsProcessed} txs`}
        />
        <StatCard
          icon={<Layers className="w-4 h-4 text-amber-400" />}
          label="Tokens Saved (session)"
          value={cumulativeSavings.tokensSaved.toString()}
          sub="cumulative"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg p-3 border ${highlight ? 'bg-cyan-950/40 border-cyan-800' : 'bg-slate-800/60 border-slate-700'}`}>
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-lg font-bold font-mono ${highlight ? 'text-cyan-300' : 'text-slate-100'}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
