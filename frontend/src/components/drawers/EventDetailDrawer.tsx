import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  FileText, 
  AlertTriangle, 
  Layers, 
  Flame, 
  Check,
  Ban
} from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';
import { StatusPill } from '../common/StatusPill';
import { RiskGauge } from '../common/RiskGauge';
import { JsonViewer } from '../common/JsonViewer';

export const EventDetailDrawer: React.FC = () => {
  const { selectedEvent, setSelectedEvent, approveEvent, rejectEvent } = useSecurity();
  const [reviewerNote, setReviewerNote] = useState('');

  if (!selectedEvent) return null;

  const handleApprove = () => {
    approveEvent(selectedEvent.id, reviewerNote || 'Authorized via Event Inspector');
    setReviewerNote('');
  };

  const handleReject = () => {
    rejectEvent(selectedEvent.id, reviewerNote || 'Denied via Event Inspector');
    setReviewerNote('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setSelectedEvent(null)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div
          className="w-screen max-w-2xl shadow-2xl flex flex-col justify-between overflow-y-auto"
          style={{ background: '#161618', borderLeft: '1px solid #2a2a2e' }}
        >
          {/* Header */}
          <div
            className="p-5 sticky top-0 z-10 backdrop-blur-md"
            style={{ background: 'rgba(22,22,24,0.92)', borderBottom: '1px solid #2a2a2e' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs mb-1" style={{ color: '#888890' }}>
                  <span className="mono font-semibold" style={{ color: '#a5b4fc' }}>#{selectedEvent.id}</span>
                  <span style={{ color: '#333338' }}>·</span>
                  <span className="mono">{selectedEvent.request_id || 'req-unknown'}</span>
                </div>
                <h2 className="text-base font-semibold" style={{ color: '#f0f0f1' }}>
                  {selectedEvent.tool_name}()
                </h2>
                <p className="text-xs mt-0.5" style={{ color: '#888890' }}>
                  Originating agent: <span className="mono font-medium" style={{ color: '#f0f0f1' }}>{selectedEvent.agent_id}</span>
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <RiskBadge level={selectedEvent.risk_level} score={selectedEvent.risk_score} size="md" />
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: '#888890', background: '#222225' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-5 flex-1">
            {/* Quick Status Bar */}
            <div
              className="p-3.5 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
              style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}
            >
              <div>
                <span className="text-[10px] block" style={{ color: '#888890' }}>Decision</span>
                <div className="mt-1">
                  <StatusPill decision={selectedEvent.decision} size="sm" />
                </div>
              </div>

              <div>
                <span className="text-[10px] block" style={{ color: '#888890' }}>Gateway Latency</span>
                <span className="mono font-semibold mt-1 block" style={{ color: '#a5b4fc' }}>
                  {selectedEvent.execution_latency_ms || 1.4} ms
                </span>
              </div>

              <div>
                <span className="text-[10px] block" style={{ color: '#888890' }}>Timestamp</span>
                <span className="mono mt-1 block" style={{ color: '#c8c8d0' }}>
                  {new Date(selectedEvent.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div>
                <span className="text-[10px] block" style={{ color: '#888890' }}>Prompt Injection</span>
                <span
                  className="font-medium mt-1 block"
                  style={{ color: selectedEvent.injection_detected ? '#f87171' : '#4ade80' }}
                >
                  {selectedEvent.injection_detected ? 'Detected' : 'Clean'}
                </span>
              </div>
            </div>

            {/* Prompt Injection Alert Box */}
            {selectedEvent.injection_detected && (
              <div
                className="p-4 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <div className="flex items-start gap-3">
                  <Flame className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold" style={{ color: '#f87171' }}>
                        Adversarial Injection Signature Detected
                      </h4>
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                      >
                        Risk +35
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#fca5a5' }}>
                      Adversarial input pattern detected within tool call payload. The policy engine forced a hard quarantine drop.
                    </p>
                    {selectedEvent.injection_details?.patterns_matched && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {selectedEvent.injection_details.patterns_matched.map((p, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] mono px-2 py-0.5 rounded"
                            style={{ background: '#251214', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Risk Analysis Card */}
            <div
              className="p-4 rounded-xl space-y-4"
              style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}
            >
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                <span className="text-xs font-medium" style={{ color: '#f0f0f1' }}>
                  Risk Analysis & Explanation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="flex justify-center">
                  <RiskGauge score={selectedEvent.risk_score} level={selectedEvent.risk_level} size="md" />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <span className="text-xs" style={{ color: '#888890' }}>
                    Reasoning traces:
                  </span>
                  <div className="space-y-1">
                    {selectedEvent.reasons.map((reason, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2 rounded flex items-start gap-2"
                        style={{ background: '#111113', color: '#c8c8d0', border: '1px solid #222224' }}
                      >
                        <span style={{ color: '#6366f1' }}>•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Intercepted Parameters */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium" style={{ color: '#888890' }}>
                Tool Call Parameters
              </span>
              <JsonViewer data={selectedEvent.parameters} title={`${selectedEvent.tool_name} Arguments`} />
            </div>

            {/* Threat Signals */}
            {selectedEvent.threat_signals && selectedEvent.threat_signals.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-medium" style={{ color: '#888890' }}>
                  Threat Signals
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEvent.threat_signals.map((sig, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      {sig}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Policies */}
            {selectedEvent.matched_policies && selectedEvent.matched_policies.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-medium" style={{ color: '#888890' }}>
                  Matched Policies
                </span>
                <div className="space-y-1">
                  {selectedEvent.matched_policies.map((pol, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-lg text-xs flex items-center justify-between"
                      style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}
                    >
                      <span className="mono" style={{ color: '#a5b4fc' }}>{pol}</span>
                      <span className="text-[10px] font-medium" style={{ color: '#888890' }}>Enforced</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Forensic Audit Trail */}
            {selectedEvent.audit_trail && (
              <div className="space-y-2">
                <span className="text-xs font-medium" style={{ color: '#888890' }}>
                  Interception Pipeline Audit
                </span>
                <div className="space-y-1.5">
                  {selectedEvent.audit_trail.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg text-xs flex items-start gap-2.5"
                      style={{ background: '#111113', border: '1px solid #222224' }}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0 mt-1"
                        style={{
                          background: item.status === 'critical' ? '#ef4444' : item.status === 'warning' ? '#f59e0b' : '#22c55e',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span className="font-semibold" style={{ color: '#f0f0f1' }}>{item.stage}</span>
                          <span style={{ color: '#555560' }}>{item.timestamp}</span>
                        </div>
                        <p style={{ color: '#888890' }}>{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer / Human Review Actions */}
          {selectedEvent.decision === 'PENDING_APPROVAL' && (
            <div
              className="p-5 sticky bottom-0 z-10 space-y-3"
              style={{ background: '#1a1a1c', borderTop: '1px solid #2a2a2e' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#fbbf24' }}>
                  <Clock className="w-3.5 h-3.5" />
                  Human Approval Required
                </span>
                <span className="text-xs" style={{ color: '#888890' }}>
                  Awaiting review
                </span>
              </div>

              <input
                type="text"
                placeholder="Optional reviewer note / reason..."
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: '#111113', color: '#f0f0f1', border: '1px solid #2a2a2e' }}
              />

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleReject}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <Ban className="w-3.5 h-3.5" />
                  Deny Action
                </button>

                <button
                  onClick={handleApprove}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve Action
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
