import React from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { 
  X, 
  Bot, 
  ChevronRight 
} from 'lucide-react';

export const AgentDetailModal: React.FC = () => {
  const { selectedAgent, setSelectedAgent, events, setSelectedEvent } = useSecurity();

  if (!selectedAgent) return null;

  const agentEvents = events.filter((e) => e.agent_id === selectedAgent.id);

  const envColor = (env: string) =>
    env === 'Production' ? { text: '#a5b4fc', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' } :
    env === 'Staging'    ? { text: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' } :
                           { text: '#888890', bg: '#222225', border: '#2a2a2e' };

  const ec = envColor(selectedAgent.environment);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setSelectedAgent(null)}
      />

      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col fade-in"
        style={{ background: '#161618', border: '1px solid #2a2a2e' }}
      >
        {/* Header */}
        <div
          className="p-5 flex items-start justify-between"
          style={{ background: '#1a1a1c', borderBottom: '1px solid #2a2a2e' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs mono font-semibold" style={{ color: '#a5b4fc' }}>
                  {selectedAgent.id}
                </span>
                <span style={{ color: '#333338' }}>·</span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-medium"
                  style={{ color: ec.text, background: ec.bg, border: `1px solid ${ec.border}` }}
                >
                  {selectedAgent.environment}
                </span>
              </div>
              <h2 className="text-base font-semibold mt-0.5" style={{ color: '#f0f0f1' }}>
                {selectedAgent.name}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setSelectedAgent(null)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
            style={{ background: '#222225' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Description */}
          <p className="leading-relaxed" style={{ color: '#888890' }}>
            {selectedAgent.description}
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
              <span className="text-[10px] block" style={{ color: '#888890' }}>Status</span>
              <span
                className="text-xs font-semibold mt-1 inline-flex items-center gap-1.5"
                style={{
                  color: selectedAgent.status === 'active' ? '#4ade80' : selectedAgent.status === 'quarantined' ? '#f87171' : '#888890',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: selectedAgent.status === 'active' ? '#22c55e' : selectedAgent.status === 'quarantined' ? '#ef4444' : '#888890',
                  }}
                />
                {selectedAgent.status[0].toUpperCase() + selectedAgent.status.slice(1)}
              </span>
            </div>

            <div className="p-3 rounded-xl" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
              <span className="text-[10px] block" style={{ color: '#888890' }}>Rate</span>
              <span className="text-xs font-semibold mono mt-1 block" style={{ color: '#a5b4fc' }}>
                {selectedAgent.requests_per_min} req/m
              </span>
            </div>

            <div className="p-3 rounded-xl" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
              <span className="text-[10px] block" style={{ color: '#888890' }}>Total Interceptions</span>
              <span className="text-xs font-semibold mono mt-1 block" style={{ color: '#f0f0f1' }}>
                {selectedAgent.total_calls}
              </span>
            </div>

            <div className="p-3 rounded-xl" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
              <span className="text-[10px] block" style={{ color: '#888890' }}>Violations</span>
              <span
                className="text-xs font-semibold mono mt-1 block"
                style={{ color: selectedAgent.violations_count > 0 ? '#f87171' : '#4ade80' }}
              >
                {selectedAgent.violations_count}
              </span>
            </div>
          </div>

          {/* Risk Profile & Sparkline */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: '#888890' }}>
                Risk Trend (Recent Windows)
              </span>
              <span className="text-xs font-semibold" style={{ color: '#fbbf24' }}>
                Avg Risk: {selectedAgent.avg_risk}/100
              </span>
            </div>

            <div className="flex items-end gap-2.5 h-16 pt-2 px-1" style={{ borderBottom: '1px solid #222224' }}>
              {selectedAgent.risk_trend.map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    style={{
                      height: `${Math.max(val, 10)}%`,
                      background: val > 60 ? '#ef4444' : val > 30 ? '#f59e0b' : '#22c55e',
                      opacity: 0.85,
                    }}
                    className="w-full rounded-sm transition-all"
                  />
                  <span className="text-[10px] mono" style={{ color: '#555560' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Allowed Tools Whitelist */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium block" style={{ color: '#888890' }}>
              Allowed Tools
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedAgent.allowed_tools.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded mono text-xs"
                  style={{ background: '#111113', color: '#c8c8d0', border: '1px solid #222224' }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Recent Agent Events */}
          <div className="space-y-2">
            <span className="text-xs font-medium block" style={{ color: '#888890' }}>
              Recent Interceptions from this Agent
            </span>
            {agentEvents.length === 0 ? (
              <p className="text-xs italic" style={{ color: '#555560' }}>No recent events logged for this agent.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {agentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setSelectedAgent(null);
                      setSelectedEvent(evt);
                    }}
                    className="p-2.5 rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                    style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="mono font-semibold" style={{ color: '#f0f0f1' }}>{evt.tool_name}</span>
                      <span className="mono text-[10px]" style={{ color: '#555560' }}>
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-medium"
                        style={{
                          color: evt.decision === 'BLOCKED' ? '#f87171' : evt.decision === 'ALLOWED' ? '#4ade80' : '#fbbf24',
                        }}
                      >
                        {evt.decision}
                      </span>
                      <span className="text-xs mono" style={{ color: '#888890' }}>{evt.risk_score}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
