import React from 'react';
import { Menu, Terminal, Server } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

interface HeaderProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ mobileOpen, setMobileOpen }) => {
  const {
    activeTab,
    setIsSimulatorOpen,
    setIsWinningDemoOpen,
    backendOnline,
    checkBackendHealth,
  } = useSecurity();

  const pageMeta: Record<string, { title: string; desc: string }> = {
    overview: { title: 'Overview', desc: 'Threat posture and event stream' },
    'live-monitor': { title: 'Live Monitor', desc: 'Intercept pipeline in real-time' },
    'approval-queue': { title: 'Approval Queue', desc: 'Pending human review' },
    policies: { title: 'Policies', desc: 'Zero-trust rule configuration' },
    agents: { title: 'Agents', desc: 'Monitored agent inventory' },
    'audit-log': { title: 'Audit Log', desc: 'Compliance and forensic trail' },
  };

  const meta = pageMeta[activeTab] || pageMeta.overview;

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-5 h-14"
      style={{
        background: 'rgba(15,15,16,0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1e1e21',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-md lg:hidden transition-colors"
          style={{ color: '#555560', border: '1px solid #2a2a2e' }}
        >
          <Menu className="w-4 h-4" />
        </button>

        <div>
          <h2 className="text-sm font-semibold" style={{ color: '#f0f0f1' }}>
            {meta.title}
          </h2>
          <p className="text-xs hidden sm:block" style={{ color: '#555560' }}>
            {meta.desc}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Backend status */}
        <button
          onClick={() => checkBackendHealth()}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors"
          style={{
            background: backendOnline ? 'rgba(34,197,94,0.08)' : '#1a1a1c',
            color: backendOnline ? '#4ade80' : '#555560',
            border: `1px solid ${backendOnline ? 'rgba(34,197,94,0.2)' : '#2a2a2e'}`,
          }}
        >
          <Server className="w-3 h-3" />
          <span>{backendOnline ? 'Connected' : 'Offline'}</span>
        </button>

        {/* Simulate */}
        <button
          onClick={() => setIsSimulatorOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: '#1a1a1c',
            color: '#c8c8d0',
            border: '1px solid #2a2a2e',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#222225';
            (e.currentTarget as HTMLElement).style.color = '#f0f0f1';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#1a1a1c';
            (e.currentTarget as HTMLElement).style.color = '#c8c8d0';
          }}
        >
          <Terminal className="w-3 h-3" style={{ color: '#6366f1' }} />
          <span className="hidden sm:inline">Simulate</span>
        </button>

        {/* Demo */}
        <button
          onClick={() => setIsWinningDemoOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: 'rgba(99,102,241,0.15)',
            color: '#a5b4fc',
            border: '1px solid rgba(99,102,241,0.3)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.22)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.45)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.15)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)';
          }}
        >
          Run Demo
        </button>
      </div>
    </header>
  );
};
