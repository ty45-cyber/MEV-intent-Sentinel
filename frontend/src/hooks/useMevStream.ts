import { useState, useEffect, useRef } from 'react';

export interface ParitokStats {
  raw_prompt_tokens: number;
  compressed_tokens: number;
  cost_saved_usd: number;
}

export interface MevIntentMetrics {
  timestamp_ms: number;
  attack_type: string;
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  target_contract: string;
  decoded_intent_summary: string;
  total_txs_analyzed: number;
  paritok_stats: ParitokStats;
}

export function useMevStream() {
  const [latestMetric, setLatestMetric] = useState<MevIntentMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<MevIntentMetrics[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const [cumulative, setCumulative] = useState({
    tokensSaved: 0,
    costSaved: 0,
    txsProcessed: 0,
  });

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
    
    const connect = () => {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => setIsConnected(true);
      
      ws.current.onmessage = (event) => {
        try {
          const data: MevIntentMetrics = JSON.parse(event.data);
          
          setLatestMetric(data);
          
          setMetricsHistory(prev => {
            const newHistory = [...prev, data];
            return newHistory.length > 60 ? newHistory.slice(1) : newHistory;
          });

          setCumulative(prev => ({
            tokensSaved: prev.tokensSaved + (data.paritok_stats.raw_prompt_tokens - data.paritok_stats.compressed_tokens),
            costSaved: prev.costSaved + data.paritok_stats.cost_saved_usd,
            txsProcessed: prev.txsProcessed + data.total_txs_analyzed,
          }));
        } catch (err) {
          console.error("Failed to parse WebSocket intent telemetry", err);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => ws.current?.close();
  }, []);

  return { latestMetric, metricsHistory, isConnected, cumulative };
}