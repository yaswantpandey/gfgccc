import React, { useState } from 'react';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/layout/ToastContainer';
import { EventDetailDrawer } from './components/drawers/EventDetailDrawer';
import { AgentDetailModal } from './components/drawers/AgentDetailModal';
import { SimulatorModal } from './components/modals/SimulatorModal';
import { WinningDemoModal } from './components/modals/WinningDemoModal';

import { OverviewPage } from './pages/OverviewPage';
import { LiveMonitorPage } from './pages/LiveMonitorPage';
import { ApprovalQueuePage } from './pages/ApprovalQueuePage';
import { PoliciesPage } from './pages/PoliciesPage';
import { AgentsPage } from './pages/AgentsPage';
import { AuditLogPage } from './pages/AuditLogPage';

const MainLayout: React.FC = () => {
  const { activeTab } = useSecurity();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'live-monitor':
        return <LiveMonitorPage />;
      case 'approval-queue':
        return <ApprovalQueuePage />;
      case 'policies':
        return <PoliciesPage />;
      case 'agents':
        return <AgentsPage />;
      case 'audit-log':
        return <AuditLogPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col lg:flex-row" style={{ background: '#0f0f10', color: '#f0f0f1' }}>
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-56 flex flex-col min-w-0">
        <Header mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <main className="flex-1 p-5 lg:p-7 max-w-7xl mx-auto w-full">
          {renderActivePage()}
        </main>
      </div>

      {/* Drawers, Modals & Toast Overlays */}
      <EventDetailDrawer />
      <AgentDetailModal />
      <SimulatorModal />
      <WinningDemoModal />
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SecurityProvider>
      <MainLayout />
    </SecurityProvider>
  );
};

export default App;
