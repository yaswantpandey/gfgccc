import React, { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { History, Search, Download, Flame, ChevronRight } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusPill } from '../components/common/StatusPill';

export const AuditLogPage: React.FC = () => {
  const { events, setSelectedEvent } = useSecurity();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDecision, setFilterDecision] = useState('ALL');

  const filteredEvents = events.filter((evt) => {
    if (filterDecision === 'GREEN'   && evt.risk_level !== 'GREEN')   return false;
    if (filterDecision === 'AMBER'   && evt.risk_level !== 'AMBER')   return false;
    if (filterDecision === 'RED'     && evt.risk_level !== 'RED')     return false;
    if (filterDecision === 'BLOCKED' && evt.decision   !== 'BLOCKED') return false;
    if (filterDecision === 'APPROVED'&& evt.decision   !== 'APPROVED')return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        evt.tool_name.toLowerCase().includes(q) ||
        evt.agent_id.toLowerCase().includes(q) ||
        String(evt.id).includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    a.download = `agentguard_audit_${Date.now()}.json`;
    a.click();
  };

  const filters = [
    { id: 'ALL', label: 'All' },
    { id: 'GREEN', label: 'Safe' },
    { id: 'AMBER', label: 'Review' },
    { id: 'RED', label: 'Critical' },
    { id: 'BLOCKED', label: 'Blocked' },
    { id: 'APPROVED', label: 'Approved' },
  ];

  return (
    <div className="space-y-5 pb-12">

      {/* Header */}
      <div
        className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
            <h1 className="text-sm font-semibold" style={{ color: '#f0f0f1' }}>Audit Log</h1>
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
              {filteredEvents.length} records
            </span>
          </div>
          <p className="text-xs" style={{ color: '#888890' }}>
            Immutable trace of all intercepted calls, risk scores, policy triggers, and approvals.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium self-start transition-colors"
          style={{ background: '#222225', color: '#c8c8d0', border: '1px solid #2a2a2e' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#333338')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#2a2a2e')}
        >
          <Download className="w-3 h-3" />
          Export JSON
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#555560' }} />
          <input
            type="text"
            placeholder="Search by tool, agent, or event ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: '#1a1a1c', border: '1px solid #2a2a2e', color: '#f0f0f1' }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 p-0.5 rounded-lg" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterDecision(f.id)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
              style={{
                background: filterDecision === f.id ? '#222225' : 'transparent',
                color: filterDecision === f.id ? '#f0f0f1' : '#888890',
                border: filterDecision === f.id ? '1px solid #2a2a2e' : '1px solid transparent',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead style={{ background: '#111113', borderBottom: '1px solid #222224' }}>
              <tr>
                {['ID', 'Time', 'Agent', 'Tool', 'Risk', 'Decision', 'Note', ''].map((col) => (
                  <th key={col} className="py-2.5 px-4 font-medium" style={{ color: '#555560' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm" style={{ color: '#555560' }}>
                    No matching records.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="cursor-pointer group transition-colors"
                    style={{ borderBottom: '1px solid #1e1e21' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#1f1f22')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <td className="py-3 px-4 font-medium mono" style={{ color: '#a5b4fc' }}>#{evt.id}</td>
                    <td className="py-3 px-4" style={{ color: '#888890' }}>
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-medium truncate max-w-[120px]" style={{ color: '#f0f0f1' }}>
                      {evt.agent_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {evt.injection_detected && <Flame className="w-3 h-3 shrink-0" style={{ color: '#ef4444' }} />}
                        <span className="font-medium mono" style={{ color: '#f0f0f1' }}>{evt.tool_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={evt.risk_level} score={evt.risk_score} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill decision={evt.decision} size="sm" />
                    </td>
                    <td className="py-3 px-4 truncate max-w-[180px] text-[11px]" style={{ color: '#888890' }}>
                      {evt.reviewer_note
                        ? <span style={{ color: '#a5b4fc' }}>{evt.reviewer_note}</span>
                        : evt.matched_policies?.[0] ?? 'POL-006 (Default allow)'}
                    </td>
                    <td className="py-3 px-4">
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#6366f1' }} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
