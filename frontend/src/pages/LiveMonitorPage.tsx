import React, { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';
import {
  Radio,
  Play,
  Bot,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Layers,
  FileCode2,
  Cpu,
} from 'lucide-react';
import { StatusPill } from '../components/common/StatusPill';
import { RiskBadge } from '../components/common/RiskBadge';

export const LiveMonitorPage: React.FC = () => {
  const { events, setSelectedEvent, simulateToolCall } = useSecurity();
  const [activePipelineStep, setActivePipelineStep] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runPipelineDemo = async (tool: string, params: any, agent: string) => {
    setIsSimulating(true);
    setActivePipelineStep(0);
    setTimeout(() => setActivePipelineStep(1), 350);
    setTimeout(() => setActivePipelineStep(2), 700);
    setTimeout(() => setActivePipelineStep(3), 1050);
    setTimeout(() => setActivePipelineStep(4), 1400);
    setTimeout(async () => {
      setActivePipelineStep(5);
      await simulateToolCall(tool, params, agent);
      setTimeout(() => { setIsSimulating(false); setActivePipelineStep(null); }, 1200);
    }, 1750);
  };

  const stages = [
    { title: 'Agent',        desc: 'Invocation',         icon: Bot,        color: '#6366f1' },
    { title: 'Tool Call',    desc: 'JSON dispatch',       icon: FileCode2,  color: '#818cf8' },
    { title: 'Interceptor',  desc: 'Zero-trust gate',     icon: Cpu,        color: '#a78bfa' },
    { title: 'Policy',       desc: 'Rule evaluation',     icon: Layers,     color: '#c4b5fd' },
    { title: 'Risk Engine',  desc: 'Heuristic + injection',icon: AlertTriangle, color: '#f59e0b' },
    { title: 'Decision',     desc: 'Allow / Review / Block', icon: CheckCircle2, color: '#22c55e' },
  ];

  return (
    <div className="space-y-5 pb-12">

      {/* Header */}
      <div className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
            <h1 className="text-sm font-semibold" style={{ color: '#f0f0f1' }}>Live Interception Pipeline</h1>
          </div>
          <p className="text-xs" style={{ color: '#888890' }}>
            Every agent tool call passes through the synchronous zero-trust gateway before execution.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            disabled={isSimulating}
            onClick={() => runPipelineDemo('drop_database_table', { table_name: 'orders', cascade: true }, 'agent-db-02')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <Play className="w-3 h-3" />
            Blocked demo
          </button>
          <button
            disabled={isSimulating}
            onClick={() => runPipelineDemo('read_file', { path: 'reports/summary.txt' }, 'agent-research-01')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            <Play className="w-3 h-3" />
            Safe demo
          </button>
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="rounded-xl p-5 space-y-4" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: '#f0f0f1' }}>Intercept Architecture</span>
          <span className="text-xs" style={{ color: '#555560' }}>Latency budget &lt; 2.5 ms</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {stages.map((stage, idx) => {
            const isActive = activePipelineStep === idx;
            const isPassed = activePipelineStep !== null && activePipelineStep > idx;
            const Icon = stage.icon;
            return (
              <div
                key={idx}
                className="rounded-lg p-3 transition-all duration-300 relative"
                style={{
                  background: isActive ? `${stage.color}12` : isPassed ? 'rgba(34,197,94,0.05)' : '#111113',
                  border: `1px solid ${isActive ? stage.color + '40' : isPassed ? 'rgba(34,197,94,0.2)' : '#222224'}`,
                  transform: isActive ? 'translateY(-1px)' : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ background: `${stage.color}15`, color: isActive || isPassed ? stage.color : '#555560' }}
                  >
                    <Icon className="w-3 h-3" />
                  </span>
                  <span className="text-[10px]" style={{ color: '#444448' }}>0{idx + 1}</span>
                </div>
                <div className="text-xs font-medium" style={{ color: isActive ? '#f0f0f1' : isPassed ? '#f0f0f1' : '#888890' }}>
                  {stage.title}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: '#555560' }}>{stage.desc}</div>
                {isActive && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full pulse-dot" style={{ background: stage.color }} />
                    <span className="text-[10px]" style={{ color: stage.color }}>Processing…</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Decision matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
          {[
            { label: 'Safe → Auto-allow',    desc: 'Risk ≤ 30 • Direct execution',          color: '#22c55e', Icon: CheckCircle2 },
            { label: 'Review → SOC queue',   desc: 'Risk 31–60 • Awaiting human approval',  color: '#f59e0b', Icon: AlertTriangle },
            { label: 'Critical → Block',     desc: 'Risk > 60 or injection • Hard drop',    color: '#ef4444', Icon: ShieldAlert   },
          ].map((d) => (
            <div
              key={d.label}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg"
              style={{ background: `${d.color}08`, border: `1px solid ${d.color}20` }}
            >
              <d.Icon className="w-4 h-4 shrink-0" style={{ color: d.color }} />
              <div>
                <div className="text-xs font-medium" style={{ color: d.color }}>{d.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: '#888890' }}>{d.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent events */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #222224' }}>
          <span className="text-sm font-medium" style={{ color: '#f0f0f1' }}>Recent Intercepts</span>
          <span className="text-xs" style={{ color: '#555560' }}>Click a row for full payload</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1e1e21' }}>
          {events.slice(0, 10).map((evt) => (
            <div
              key={evt.id}
              onClick={() => setSelectedEvent(evt)}
              className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
              style={{ borderBottom: '1px solid #1e1e21' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#1f1f22')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <div className="flex items-center gap-3 min-w-0">
                <RiskBadge level={evt.risk_level} score={evt.risk_score} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium mono" style={{ color: '#f0f0f1' }}>{evt.tool_name}</span>
                    <span style={{ color: '#333338' }}>·</span>
                    <span className="text-xs" style={{ color: '#888890' }}>{evt.agent_id}</span>
                  </div>
                  {evt.reasons[0] && (
                    <p className="text-[11px] truncate mt-0.5" style={{ color: '#555560' }}>{evt.reasons[0]}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <StatusPill decision={evt.decision} size="sm" />
                <span className="text-[11px] hidden sm:block" style={{ color: '#555560' }}>
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="py-12 text-center text-sm" style={{ color: '#555560' }}>
              No events yet. Run a demo to populate the stream.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
