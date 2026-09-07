import React from 'react';
import {
  Shield,
  Activity,
  CheckSquare,
  FileCode2,
  Bot,
  History,
  Terminal,
  Radio,
  Lock,
  Zap
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, pendingApprovals, setIsWinningDemoOpen } = useSecurity();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'live-monitor', label: 'Live Monitor', icon: Radio },
    {
      id: 'approval-queue',
      label: 'Approval Queue',
      icon: CheckSquare,
      badge: pendingApprovals.length > 0 ? pendingApprovals.length : undefined,
    },
    { id: 'policies', label: 'Policies', icon: FileCode2 },
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'audit-log', label: 'Audit Log', icon: History },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-56 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: '#111113',
          borderRight: '1px solid #1e1e21',
        }}
      >
        {/* Logo */}
        <div className="px-4 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid #1e1e21' }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <Shield className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight" style={{ color: '#f0f0f1' }}>
              AgentGuard
            </span>
            <div className="text-[10px] mt-0.5" style={{ color: '#555560' }}>
              Runtime Security
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <div className="px-2 pt-1 pb-1.5 text-[10px] font-medium tracking-widest uppercase" style={{ color: '#444448' }}>
            Navigation
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (mobileOpen) setMobileOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all duration-100"
                style={{
                  background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                  color: isActive ? '#a5b4fc' : '#888890',
                  border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = '#1a1a1c';
                    (e.currentTarget as HTMLElement).style.color = '#f0f0f1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = '#888890';
                  }
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(245,158,11,0.15)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245,158,11,0.25)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Action */}
        <div className="p-3" style={{ borderTop: '1px solid #1e1e21' }}>
          <button
            onClick={() => {
              setIsWinningDemoOpen(true);
              if (mobileOpen) setMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-100"
            style={{
              background: 'rgba(99,102,241,0.1)',
              color: '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.18)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.35)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)';
            }}
          >
            <Zap className="w-3 h-3" />
            Run Demo
          </button>

          {/* Status */}
          <div className="mt-2.5 flex items-center gap-2 px-1">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 pulse-dot"
              style={{ background: '#22c55e' }}
            />
            <span className="text-[11px]" style={{ color: '#555560' }}>
              System protected
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
