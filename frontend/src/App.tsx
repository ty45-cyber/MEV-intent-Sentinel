import React, { useRef, useEffect } from 'react';
import { ShieldCheck, Terminal } from 'lucide-react';
import { useMevStream } from './hooks/useMevStream';
import { ParitokStatsWidget } from './components/ParitokStats';
import { IntentGraph } from './components/IntentGraph';
import { RawCalldataBox } from './components/RawCalldataBox';

const riskBadge: Record<string, string> = {
  Low: 'text-emerald-400',
  Medium: 'text-amber-400',
  High: 'text-orange-400',
  Critical: 'text-rose-400',
};

export function App() {
  const { latestMetric, metricsHistory, isConnected, cumulative } = useMevStream();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [metricsHistory.length]);

  const defaultStats = latestMetric?.paritok_stats ?? {
    raw_prompt_tokens: 150,
    compressed_tokens: 45,
    cost_saved_usd: 0.0005,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-950/80 border border-cyan-800 text-cyan-400 rounded-xl">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">MEV Intent Sentinel</h1>
            <p className="text-xs text-slate-400">Dark Forest Mempool Intent Decoder &amp; Paritok Token-Efficiency Engine</p>
          </div>
        </div>

        <span className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono border ${
          isConnected
            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
            : 'bg-amber-950/80 text-amber-400 border-amber-800'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>{isConnected ? 'LIVE MEMPOOL: MONAD TESTNET WSS' : 'CONNECTING TO BACKEND...'}</span>
        </span>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* Paritok stats bar */}
        <ParitokStatsWidget stats={defaultStats} cumulativeSavings={cumulative} />

        {/* Graph + Intent decoder */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <IntentGraph history={metricsHistory} />
          </div>
          <div>
            <RawCalldataBox metric={latestMetric} />
          </div>
        </div>

        {/* Telemetry log — accumulates all events */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2 text-slate-400">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Broadcasting Telemetry Log
            </span>
            <span className="text-slate-600">Channel: broadcast::intent_tx &nbsp;|&nbsp; {metricsHistory.length} events</span>
          </div>

          <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
            {metricsHistory.length === 0 ? (
              <p className="text-slate-600 py-1">Awaiting intent packets from Rust core engine...</p>
            ) : (
              metricsHistory.map((m, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 gap-2 py-1 border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors"
                >
                  <span className="text-slate-500">[{new Date(m.timestamp_ms).toLocaleTimeString()}]</span>
                  <span>
                    Attack: <strong className="text-rose-400">{m.attack_type}</strong>
                  </span>
                  <span>
                    Risk: <strong className={riskBadge[m.risk_level] ?? 'text-slate-300'}>
                      {Math.round(m.risk_score * 100)}% ({m.risk_level})
                    </strong>
                  </span>
                  <span>
                    Saved: <strong className="text-cyan-400">
                      {m.paritok_stats.raw_prompt_tokens - m.paritok_stats.compressed_tokens} tkns
                    </strong>
                  </span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </main>
    </div>
  );
}
