import React, { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';
import {
  Activity,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Bot,
  Search,
  Flame,
  ChevronRight,
  TrendingUp,
  Terminal,
  Zap,
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusPill } from '../components/common/StatusPill';

export const OverviewPage: React.FC = () => {
  const {
    events,
    stats,
    agents,
    pendingApprovals,
    setSelectedEvent,
    setSelectedAgent,
    setIsSimulatorOpen,
    setIsWinningDemoOpen,
    setActiveTab,
  } = useSecurity();

  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = events.filter((e) => {
    if (filterType === 'ALLOWED' && e.decision !== 'ALLOWED' && e.decision !== 'APPROVED') return false;
    if (filterType === 'REVIEW' && e.decision !== 'PENDING_APPROVAL') return false;
    if (filterType === 'BLOCKED' && e.decision !== 'BLOCKED' && e.decision !== 'REJECTED') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.tool_name.toLowerCase().includes(q) ||
        e.agent_id.toLowerCase().includes(q) ||
        String(e.id).includes(q)
      );
    }
    return true;
  });

  const totalCount = stats.total_events || 1;
  const greenPct = Math.round((stats.green_count / totalCount) * 100) || 80;
  const amberPct = Math.round((stats.amber_count / totalCount) * 100) || 15;
  const redPct   = Math.round((stats.red_count   / totalCount) * 100) || 5;

  const postureColor =
    stats.security_posture === 'NORMAL' ? '#22c55e' :
    stats.security_posture === 'ELEVATED' ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-5 pb-12">

      {/* Top summary strip */}
      <div
        className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: '#22c55e' }} />
            <span className="text-xs font-medium" style={{ color: '#22c55e' }}>Protected</span>
            <span className="text-xs" style={{ color: '#555560' }}>·</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ color: postureColor, background: `${postureColor}12`, border: `1px solid ${postureColor}30` }}
            >
              {stats.security_posture || 'NORMAL'}
            </span>
          </div>
          <h1 className="text-base font-semibold" style={{ color: '#f0f0f1' }}>
            AI Agent Runtime Security Gateway
          </h1>
          <p className="text-xs mt-0.5 max-w-xl" style={{ color: '#888890' }}>
            Real-time tool-call interception, risk scoring, and policy enforcement for autonomous agents.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: '#222225', color: '#c8c8d0', border: '1px solid #2a2a2e' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#333338')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#2a2a2e')}
          >
            <Terminal className="w-3 h-3" style={{ color: '#6366f1' }} />
            Simulate
          </button>
          <button
            onClick={() => setIsWinningDemoOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.22)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.15)')}
          >
            <Zap className="w-3 h-3" />
            Demo
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="Total Calls"      value={stats.total_events}              icon={<Activity className="w-3.5 h-3.5" />}     accent="#6366f1" trend={{ direction: 'up', text: '+14% hr' }} />
        <MetricCard label="Allowed"          value={stats.allowed_count}             icon={<CheckCircle2 className="w-3.5 h-3.5" />}  accent="#22c55e" subtext={`${greenPct}% auto-cleared`} />
        <MetricCard label="In Review"        value={stats.pending_count}             icon={<Clock className="w-3.5 h-3.5" />}         accent="#f59e0b" subtext="Awaiting approval" />
        <MetricCard label="Blocked"          value={stats.blocked_count}             icon={<ShieldAlert className="w-3.5 h-3.5" />}   accent="#ef4444" subtext="Hard quarantined" />
        <MetricCard label="Avg Risk Score"   value={`${stats.avg_risk_score ?? 0}/100`} icon={<TrendingUp className="w-3.5 h-3.5" />} accent="#6366f1" subtext="Deterministic" />
        <MetricCard label="Injections"       value={stats.injection_detected_count}  icon={<Flame className="w-3.5 h-3.5" />}         accent="#ef4444" subtext="Adversarial" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Event stream */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
          {/* Stream header */}
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ borderBottom: '1px solid #222224' }}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: '#6366f1' }} />
              <span className="text-sm font-medium" style={{ color: '#f0f0f1' }}>Event Stream</span>
              <span className="text-xs" style={{ color: '#555560' }}>{filteredEvents.length} events</span>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: '#111113', border: '1px solid #2a2a2e' }}>
              {['ALL', 'ALLOWED', 'REVIEW', 'BLOCKED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                  style={{
                    background: filterType === f ? '#222225' : 'transparent',
                    color: filterType === f ? '#f0f0f1' : '#888890',
                    border: filterType === f ? '1px solid #2a2a2e' : '1px solid transparent',
                  }}
                >
                  {f === 'ALLOWED' ? 'Safe' : f === 'REVIEW' ? 'Review' : f === 'BLOCKED' ? 'Blocked' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #1e1e21' }}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#555560' }} />
              <input
                type="text"
                placeholder="Search by tool name, agent, or event ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-colors"
                style={{
                  background: '#111113',
                  border: '1px solid #2a2a2e',
                  color: '#f0f0f1',
                }}
              />
            </div>
          </div>

          {/* Event rows */}
          <div className="divide-y max-h-[480px] overflow-y-auto" style={{ '--tw-divide-opacity': '1', borderColor: '#1e1e21' } as any}>
            {filteredEvents.length === 0 ? (
              <div className="py-16 text-center text-sm" style={{ color: '#555560' }}>
                No events match the current filter.
              </div>
            ) : (
              filteredEvents.slice(0, 20).map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors fade-in group"
                  style={{ borderBottom: '1px solid #1e1e21' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#1f1f22')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <RiskBadge level={evt.risk_level} score={evt.risk_score} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium mono truncate" style={{ color: '#f0f0f1' }}>
                          {evt.tool_name}
                        </span>
                        <span style={{ color: '#333338' }}>·</span>
                        <span className="text-xs truncate" style={{ color: '#888890' }}>{evt.agent_id}</span>
                      </div>
                      {evt.reasons[0] && (
                        <p className="text-[11px] truncate mt-0.5" style={{ color: '#555560' }}>
                          {evt.reasons[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <StatusPill decision={evt.decision} size="sm" />
                    <span className="text-[11px] hidden sm:block" style={{ color: '#555560' }}>
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#6366f1' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Risk distribution */}
          <div className="rounded-xl p-4 space-y-4" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: '#f0f0f1' }}>Risk Distribution</span>
            </div>

            {/* Bar */}
            <div className="h-2 rounded-full overflow-hidden flex gap-0.5" style={{ background: '#111113' }}>
              <div style={{ width: `${greenPct}%`, background: '#22c55e', borderRadius: '99px 0 0 99px' }} title={`Safe: ${greenPct}%`} />
              <div style={{ width: `${amberPct}%`, background: '#f59e0b' }} title={`Review: ${amberPct}%`} />
              <div style={{ width: `${redPct}%`, background: '#ef4444', borderRadius: '0 99px 99px 0' }} title={`Blocked: ${redPct}%`} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Safe',    pct: greenPct, color: '#22c55e' },
                { label: 'Review',  pct: amberPct, color: '#f59e0b' },
                { label: 'Blocked', pct: redPct,   color: '#ef4444' },
              ].map((d) => (
                <div key={d.label} className="rounded-lg p-2.5" style={{ background: '#111113', border: '1px solid #222224' }}>
                  <div className="text-base font-semibold" style={{ color: d.color }}>{d.pct}%</div>
                  <div className="text-[11px] mt-0.5" style={{ color: '#555560' }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active agents */}
          <div className="rounded-xl overflow-hidden" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #222224' }}>
              <div className="flex items-center gap-2">
                <Bot className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
                <span className="text-sm font-medium" style={{ color: '#f0f0f1' }}>Agents</span>
              </div>
              <button
                onClick={() => setActiveTab('agents')}
                className="text-xs transition-colors"
                style={{ color: '#6366f1' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#a5b4fc')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#6366f1')}
              >
                View all →
              </button>
            </div>

            <div className="divide-y" style={{ borderColor: '#1e1e21' }}>
              {agents.slice(0, 4).map((agent) => {
                const statusColor = agent.status === 'active' ? '#22c55e' : agent.status === 'quarantined' ? '#ef4444' : '#888890';
                const riskColor   = agent.avg_risk > 60 ? '#ef4444' : agent.avg_risk > 30 ? '#f59e0b' : '#22c55e';
                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className="px-4 py-3 flex items-center justify-between cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid #1e1e21' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#1f1f22')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColor }} />
                        <span className="text-xs font-medium mono" style={{ color: '#f0f0f1' }}>{agent.name}</span>
                      </div>
                      <div className="text-[11px] mt-0.5 ml-3" style={{ color: '#555560' }}>
                        {agent.last_action} · {agent.requests_per_min} req/m
                      </div>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: riskColor }}>
                      {agent.avg_risk}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
