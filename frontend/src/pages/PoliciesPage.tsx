import React, { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { FileCode2, Search, Power } from 'lucide-react';

export const PoliciesPage: React.FC = () => {
  const { policies, togglePolicy } = useSecurity();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  const filteredPolicies = policies.filter((p) => {
    if (selectedSeverity !== 'ALL' && p.severity !== selectedSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    }
    return true;
  });

  const sevColor = (s: string) =>
    s === 'CRITICAL' ? { text: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' } :
    s === 'HIGH'     ? { text: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' } :
                       { text: '#4ade80', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)'  };

  const actionColor = (a: string) =>
    a.includes('BLOCK')  ? '#f87171' :
    a.includes('REVIEW') ? '#fbbf24' : '#4ade80';

  return (
    <div className="space-y-5 pb-12">

      {/* Header */}
      <div className="rounded-xl p-5" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
        <div className="flex items-center gap-2 mb-1">
          <FileCode2 className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
          <h1 className="text-sm font-semibold" style={{ color: '#f0f0f1' }}>Security Policies</h1>
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
            {policies.filter(p => p.is_active).length}/{policies.length} active
          </span>
        </div>
        <p className="text-xs" style={{ color: '#888890' }}>
          Deterministic rules enforced on every runtime tool call.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#555560' }} />
          <input
            type="text"
            placeholder="Search policies…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: '#1a1a1c', border: '1px solid #2a2a2e', color: '#f0f0f1' }}
          />
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSeverity(s)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
              style={{
                background: selectedSeverity === s ? '#222225' : 'transparent',
                color: selectedSeverity === s ? '#f0f0f1' : '#888890',
                border: selectedSeverity === s ? '1px solid #2a2a2e' : '1px solid transparent',
              }}
            >
              {s[0] + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredPolicies.map((policy) => {
          const sc = sevColor(policy.severity);
          return (
            <div
              key={policy.id}
              className="rounded-xl p-4 flex flex-col gap-3 transition-opacity"
              style={{
                background: '#1a1a1c',
                border: '1px solid #2a2a2e',
                opacity: policy.is_active ? 1 : 0.5,
              }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium mono" style={{ color: '#a5b4fc' }}>{policy.id}</span>
                  <span
                    className="text-[11px] font-medium px-1.5 py-0.5 rounded-md"
                    style={{ color: sc.text, background: sc.bg, border: `1px solid ${sc.border}` }}
                  >
                    {policy.severity[0] + policy.severity.slice(1).toLowerCase()}
                  </span>
                </div>
                <button
                  onClick={() => togglePolicy(policy.id)}
                  className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md shrink-0 transition-colors"
                  style={{
                    background: policy.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(136,136,144,0.08)',
                    color: policy.is_active ? '#4ade80' : '#888890',
                    border: `1px solid ${policy.is_active ? 'rgba(34,197,94,0.25)' : '#2a2a2e'}`,
                  }}
                >
                  <Power className="w-2.5 h-2.5" />
                  {policy.is_active ? 'On' : 'Off'}
                </button>
              </div>

              <div>
                <div className="text-sm font-medium" style={{ color: '#f0f0f1' }}>{policy.name}</div>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#888890' }}>{policy.description}</p>
              </div>

              <div className="space-y-2 pt-2" style={{ borderTop: '1px solid #222224' }}>
                {/* Action */}
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: '#888890' }}>Gateway action</span>
                  <span className="font-medium" style={{ color: actionColor(policy.action) }}>{policy.action}</span>
                </div>

                {/* Target tools */}
                <div>
                  <div className="text-[11px] mb-1" style={{ color: '#555560' }}>Target tools</div>
                  <div className="flex flex-wrap gap-1">
                    {policy.target_tools.map((t, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-1.5 py-0.5 rounded mono"
                        style={{ background: '#111113', color: '#c8c8d0', border: '1px solid #222224' }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rule */}
                <div
                  className="text-[11px] mono px-2.5 py-1.5 rounded-lg truncate"
                  style={{ background: '#111113', color: '#a5b4fc', border: '1px solid #222224' }}
                >
                  {policy.rule_pattern}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-[11px]" style={{ color: '#555560' }}>
                  <span>Triggered {policy.triggers_count}×</span>
                  {policy.last_triggered && <span>Last: {policy.last_triggered}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
