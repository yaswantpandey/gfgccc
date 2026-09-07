import React from 'react';
import { RiskLevel } from '../../types';

interface RiskGaugeProps {
  score: number;
  level?: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showContributors?: boolean;
  contributors?: { points: number; reason: string }[];
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  level,
  size = 'md',
  showContributors = false,
  contributors = [],
}) => {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const computedLevel = level || (normalizedScore <= 30 ? 'GREEN' : normalizedScore <= 60 ? 'AMBER' : 'RED');

  const getColorTheme = () => {
    switch (computedLevel) {
      case 'GREEN':
        return {
          stroke: '#22c55e',
          text: '#4ade80',
          label: 'Low Risk',
        };
      case 'AMBER':
        return {
          stroke: '#f59e0b',
          text: '#fbbf24',
          label: 'Medium Risk',
        };
      case 'RED':
        return {
          stroke: '#ef4444',
          text: '#f87171',
          label: 'Critical Risk',
        };
    }
  };

  const theme = getColorTheme();

  const radius = size === 'lg' ? 44 : size === 'md' ? 34 : 24;
  const strokeWidth = size === 'lg' ? 6 : size === 'md' ? 5 : 3.5;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * normalizedScore) / 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg
          className={`transform -rotate-135 ${
            size === 'lg' ? 'w-28 h-28' : size === 'md' ? 'w-20 h-20' : 'w-14 h-14'
          }`}
          viewBox="0 0 100 100"
        >
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#222225"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active progress */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>

        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span
            className={`mono font-semibold ${
              size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'
            }`}
            style={{ color: '#f0f0f1' }}
          >
            {normalizedScore}
          </span>
          <span className="text-[10px]" style={{ color: '#555560' }}>
            / 100
          </span>
        </div>
      </div>

      <div className="mt-1 text-xs font-medium" style={{ color: theme.text }}>
        {theme.label}
      </div>

      {/* Optional Contributors */}
      {showContributors && contributors.length > 0 && (
        <div className="w-full mt-3 space-y-1.5 pt-3" style={{ borderTop: '1px solid #222224' }}>
          <div className="text-[11px] font-medium" style={{ color: '#888890' }}>
            Score Factors
          </div>
          <div className="space-y-1">
            {contributors.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 px-2 rounded"
                style={{ background: '#111113', border: '1px solid #222224' }}
              >
                <span className="truncate mr-2" style={{ color: '#c8c8d0' }}>{c.reason}</span>
                <span className="mono text-xs font-semibold shrink-0" style={{ color: '#fbbf24' }}>
                  +{c.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
