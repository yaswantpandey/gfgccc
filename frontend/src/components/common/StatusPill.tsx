import React from 'react';
import { CheckCircle2, ShieldAlert, Clock, Check, XCircle } from 'lucide-react';
import { Decision } from '../../types';

interface StatusPillProps {
  decision: Decision;
  size?: 'sm' | 'md';
}

const config: Record<string, { label: string; color: string; bg: string; border: string; Icon: any }> = {
  ALLOWED:          { label: 'Allowed',  color: '#4ade80', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   Icon: CheckCircle2 },
  BLOCKED:          { label: 'Blocked',  color: '#f87171', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   Icon: ShieldAlert },
  PENDING_APPROVAL: { label: 'Review',   color: '#fbbf24', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  Icon: Clock },
  APPROVED:         { label: 'Approved', color: '#818cf8', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.2)', Icon: Check },
  REJECTED:         { label: 'Denied',   color: '#888890', bg: 'rgba(136,136,144,0.06)', border: 'rgba(136,136,144,0.15)', Icon: XCircle },
};

export const StatusPill: React.FC<StatusPillProps> = ({ decision, size = 'md' }) => {
  const c = config[decision] ?? config.REJECTED;
  const Icon = c.Icon;
  const sz = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium ${sz}`}
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}
    >
      <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {c.label}
    </span>
  );
};
