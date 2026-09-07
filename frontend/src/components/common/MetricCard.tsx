import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  accent?: string;
  trend?: { direction: 'up' | 'down' | 'neutral'; text: string };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  accent = '#6366f1',
  trend,
}) => {
  return (
    <div
      className="p-4 rounded-xl transition-colors duration-150"
      style={{ background: '#1a1a1c', border: '1px solid #2a2a2e' }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#333338')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#2a2a2e')}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: '#888890' }}>
          {label}
        </span>
        {icon && (
          <span className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${accent}18`, color: accent }}>
            {icon}
          </span>
        )}
      </div>

      <div className="text-2xl font-semibold tracking-tight" style={{ color: '#f0f0f1' }}>
        {value}
      </div>

      {(subtext || trend) && (
        <div className="mt-1.5 flex items-center justify-between">
          {subtext && (
            <span className="text-xs" style={{ color: '#555560' }}>{subtext}</span>
          )}
          {trend && (
            <span
              className="text-xs font-medium"
              style={{
                color: trend.direction === 'up' ? '#4ade80' : trend.direction === 'down' ? '#f87171' : '#888890',
              }}
            >
              {trend.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
