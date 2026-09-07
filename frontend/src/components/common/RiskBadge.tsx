import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

const cfg = {
  GREEN: { dot: '#22c55e', text: '#4ade80', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  label: 'Safe'     },
  AMBER: { dot: '#f59e0b', text: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', label: 'Review'   },
  RED:   { dot: '#ef4444', text: '#f87171', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  label: 'Critical' },
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md', showDot = true }) => {
  const c = cfg[level] ?? cfg.GREEN;
  const sizeClass = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : size === 'lg' ? 'text-sm px-2.5 py-1' : 'text-xs px-2 py-0.5';
  const dotSize  = size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium ${sizeClass}`}
      style={{ color: c.text, background: c.bg, border: `1px solid ${c.border}` }}
    >
      {showDot && <span className={`${dotSize} rounded-full shrink-0`} style={{ background: c.dot }} />}
      <span>{c.label}</span>
      {score !== undefined && (
        <span className="opacity-60 font-normal">{score}</span>
      )}
    </span>
  );
};
