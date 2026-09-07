import React, { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { Bot, Search } from 'lucide-react';

export const AgentsPage: React.FC = () => {
  const { agents, setSelectedAgent } = useSecurity();
  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState('ALL');

  const filteredAgents = agents.filter((agent) => {
    if (envFilter !== 'ALL' && agent.environment !== envFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return agent.name.toLowerCase().includes(q) || agent.id.toLowerCase().includes(q) || agent.description.toLowerCase().includes(q);
    }
    return true;
  });

  const statusColor = (s: string) =>
    s === 'active' ? '#22c55e' : s === 'quarantined' ? '#ef4444' : '#888890';

  const riskColor = (r: number) =>
    r > 60 ? '#ef4444' : r > 30 ? '#f59e0b' : '#22c55e';

  const envLabel = (e: string) =>
    e === 'Production' ? { text: '#a5b4fc', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' } :
    e === 'Staging'    ? { text: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' } :
                         { text: '#888890', bg: 'rgba(136,136,144,0.06)', border: '#2a2a2e' };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="rounded-xl p-5" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
        <div className="flex items-center gap-2 mb-1">
          <Bot className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
          <h1 className="text-sm font-semibold" style={{ color: '#f0f0f1' }}>Agent Inventory</h1>
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
            {agents.length} registered
          </span>
        </div>
        <p className="text-xs" style={{ color: '#888890' }}>
          Runtime telemetry, anomaly scoring, and violation history per agent identity.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#555560' }} />
          <input
            type="text"
            placeholder="Search agents…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: '#1a1a1c', border: '1px solid #2a2a2e', color: '#f0f0f1' }}
          />
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
          {['ALL', 'Production', 'Staging', 'Sandbox'].map((env) => (
            <button
              key={env}
              onClick={() => setEnvFilter(env)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
              style={{
                background: envFilter === env ? '#222225' : 'transparent',
                color: envFilter === env ? '#f0f0f1' : '#888890',
                border: envFilter === env ? '1px solid #2a2a2e' : '1px solid transparent',
              }}
            >
              {env}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAgents.map((agent) => {
          const sc = statusColor(agent.status);
          const ec = envLabel(agent.environment);
          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className="rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-3"
              style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#333338';
                (e.currentTarget as HTMLElement).style.background = '#1f1f22';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2e';
                (e.currentTarget as HTMLElement).style.background = '#1a1a1c';
              }}
            >
              {/* Top */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-medium mono" style={{ color: '#a5b4fc' }}>{agent.id}</span>
                  <span
                    className="text-[11px] font-medium px-1.5 py-0.5 rounded-md"
                    style={{ color: ec.text, background: ec.bg, border: `1px solid ${ec.border}` }}
                  >
                    {agent.environment}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium shrink-0"
                  style={{ color: sc }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc }} />
                  {agent.status[0].toUpperCase() + agent.status.slice(1)}
                </span>
              </div>

              <div>
                <div className="text-sm font-medium" style={{ color: '#f0f0f1' }}>{agent.name}</div>
                <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: '#888890' }}>{agent.description}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-1.5 pt-2" style={{ borderTop: '1px solid #222224' }}>
                {[
                  { label: 'Total calls', value: agent.total_calls, color: '#f0f0f1' },
                  { label: 'Rate',        value: `${agent.requests_per_min}/m`, color: '#a5b4fc' },
                  { label: 'Avg risk',    value: agent.avg_risk, color: riskColor(agent.avg_risk) },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg p-2 text-center" style={{ background: '#111113', border: '1px solid #222224' }}>
                    <div className="text-xs font-semibold" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: '#555560' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px]" style={{ color: '#555560' }}>
                <span>Last: <span className="mono" style={{ color: '#888890' }}>{agent.last_action}</span></span>
                <span>{agent.last_seen}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
