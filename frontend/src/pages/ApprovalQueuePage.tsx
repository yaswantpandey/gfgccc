import React, { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { CheckSquare, CheckCircle2, Ban, Check, Layers } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { JsonViewer } from '../components/common/JsonViewer';

export const ApprovalQueuePage: React.FC = () => {
  const { pendingApprovals, approveEvent, rejectEvent, setSelectedEvent, setIsSimulatorOpen } = useSecurity();
  const [reviewerNotes, setReviewerNotes] = useState<{ [key: string | number]: string }>({});

  const handleNoteChange = (id: string | number, text: string) => {
    setReviewerNotes((prev) => ({ ...prev, [id]: text }));
  };

  return (
    <div className="space-y-5 pb-12">

      {/* Header */}
      <div
        className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
            <h1 className="text-sm font-semibold" style={{ color: '#f0f0f1' }}>Approval Queue</h1>
            {pendingApprovals.length > 0 && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}
              >
                {pendingApprovals.length} pending
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: '#888890' }}>
            Medium-to-high risk agent actions paused for human review before execution.
          </p>
        </div>
        <button
          onClick={() => setIsSimulatorOpen(true)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg self-start transition-colors"
          style={{ background: '#222225', color: '#c8c8d0', border: '1px solid #2a2a2e' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#333338')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#2a2a2e')}
        >
          Generate test event
        </button>
      </div>

      {/* Empty state */}
      {pendingApprovals.length === 0 ? (
        <div
          className="rounded-xl p-16 text-center"
          style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <CheckCircle2 className="w-5 h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: '#f0f0f1' }}>Queue is clear</p>
          <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: '#888890' }}>
            No actions are pending approval. All tool calls are within zero-trust limits.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingApprovals.map((evt) => (
            <div
              key={evt.id}
              className="rounded-xl overflow-hidden fade-in"
              style={{ background: '#1a1a1c', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              {/* Card header */}
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ borderBottom: '1px solid #222224' }}>
                <div>
                  <div className="flex items-center gap-2 text-xs mb-1" style={{ color: '#888890' }}>
                    <span>Event #{evt.id}</span>
                    <span style={{ color: '#333338' }}>·</span>
                    <span>{evt.request_id || 'req-unknown'}</span>
                    <span style={{ color: '#333338' }}>·</span>
                    <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold mono" style={{ color: '#f0f0f1' }}>{evt.tool_name}()</span>
                    <span className="text-xs" style={{ color: '#888890' }}>by</span>
                    <span className="text-xs font-medium mono" style={{ color: '#a5b4fc' }}>{evt.agent_id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RiskBadge level={evt.risk_level} score={evt.risk_score} size="md" />
                  <button
                    onClick={() => setSelectedEvent(evt)}
                    className="text-xs transition-colors"
                    style={{ color: '#6366f1' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#a5b4fc')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#6366f1')}
                  >
                    Full details →
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Parameters */}
                <div>
                  <div className="text-xs font-medium mb-2" style={{ color: '#888890' }}>Parameters</div>
                  <JsonViewer data={evt.parameters} title="Payload" maxHeight="max-h-48" />
                </div>

                {/* Reasons */}
                <div
                  className="rounded-lg p-4 space-y-3"
                  style={{ background: '#111113', border: '1px solid #222224' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#888890' }}>Policy triggers</span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}
                    >
                      Score: {evt.risk_score}/100
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {evt.reasons.map((r, i) => (
                      <div key={i} className="text-xs rounded-md px-2.5 py-1.5 mono" style={{ background: '#0f0f10', color: '#c8c8d0', border: '1px solid #222224' }}>
                        {r}
                      </div>
                    ))}
                  </div>
                  {evt.matched_policies && (
                    <div className="flex items-center gap-1.5 pt-1 text-xs" style={{ color: '#a5b4fc' }}>
                      <Layers className="w-3 h-3" />
                      <span>{evt.matched_policies.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action bar */}
              <div
                className="px-5 py-3 flex flex-col sm:flex-row items-center gap-3"
                style={{ borderTop: '1px solid #222224', background: '#111113' }}
              >
                <input
                  type="text"
                  placeholder="Reviewer note or justification…"
                  value={reviewerNotes[evt.id] || ''}
                  onChange={(e) => handleNoteChange(evt.id, e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none transition-colors"
                  style={{ background: '#1a1a1c', color: '#f0f0f1', border: '1px solid #2a2a2e' }}
                />
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => rejectEvent(evt.id, reviewerNotes[evt.id] || 'Denied by reviewer')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)')}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Deny
                  </button>
                  <button
                    onClick={() => approveEvent(evt.id, reviewerNotes[evt.id] || 'Authorized by reviewer')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.2)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.12)')}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
