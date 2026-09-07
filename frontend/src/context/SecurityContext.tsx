import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  SecurityEvent, 
  Agent, 
  Policy, 
  DashboardStats, 
  NotificationToast, 
  ToolCallParameters 
} from '../types';
import { 
  INITIAL_EVENTS, 
  INITIAL_AGENTS, 
  INITIAL_POLICIES, 
  INITIAL_STATS 
} from '../data/mockData';
import { ApiService } from '../services/api';

interface SecurityContextType {
  events: SecurityEvent[];
  agents: Agent[];
  policies: Policy[];
  stats: DashboardStats;
  pendingApprovals: SecurityEvent[];
  selectedEvent: SecurityEvent | null;
  selectedAgent: Agent | null;
  isSimulatorOpen: boolean;
  isWinningDemoOpen: boolean;
  activeTab: string;
  backendOnline: boolean;
  toasts: NotificationToast[];
  
  // Actions
  setActiveTab: (tab: string) => void;
  setSelectedEvent: (event: SecurityEvent | null) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  setIsSimulatorOpen: (open: boolean) => void;
  setIsWinningDemoOpen: (open: boolean) => void;
  addEvent: (event: SecurityEvent) => void;
  approveEvent: (eventId: number | string, reviewerNote?: string) => void;
  rejectEvent: (eventId: number | string, reviewerNote?: string) => void;
  togglePolicy: (policyId: string) => void;
  simulateToolCall: (toolName: string, params: ToolCallParameters, agentId?: string) => Promise<SecurityEvent>;
  addToast: (toast: Omit<NotificationToast, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  checkBackendHealth: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<SecurityEvent[]>(INITIAL_EVENTS);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [policies, setPolicies] = useState<Policy[]>(INITIAL_POLICIES);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isWinningDemoOpen, setIsWinningDemoOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  // Periodically check FastAPI health
  const checkBackendHealth = useCallback(async () => {
    const online = await ApiService.checkHealth();
    setBackendOnline(online);
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 8000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  const addToast = useCallback((toast: Omit<NotificationToast, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: NotificationToast = {
      ...toast,
      id,
      timestamp: new Date().toLocaleTimeString(),
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));

    // Auto dismiss after 4.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pendingApprovals = useMemo(() => {
    return events.filter((e) => e.decision === 'PENDING_APPROVAL');
  }, [events]);

  // Compute live dynamic stats
  const stats = useMemo((): DashboardStats => {
    const total = events.length + (INITIAL_STATS.total_events - INITIAL_EVENTS.length);
    const greens = events.filter((e) => e.risk_level === 'GREEN').length + (INITIAL_STATS.green_count - INITIAL_EVENTS.filter((e) => e.risk_level === 'GREEN').length);
    const ambers = events.filter((e) => e.risk_level === 'AMBER').length + (INITIAL_STATS.amber_count - INITIAL_EVENTS.filter((e) => e.risk_level === 'AMBER').length);
    const reds = events.filter((e) => e.risk_level === 'RED').length + (INITIAL_STATS.red_count - INITIAL_EVENTS.filter((e) => e.risk_level === 'RED').length);
    const blocked = events.filter((e) => e.decision === 'BLOCKED' || e.decision === 'REJECTED').length + (INITIAL_STATS.blocked_count - INITIAL_EVENTS.filter((e) => e.decision === 'BLOCKED' || e.decision === 'REJECTED').length);
    const allowed = events.filter((e) => e.decision === 'ALLOWED' || e.decision === 'APPROVED').length + (INITIAL_STATS.allowed_count - INITIAL_EVENTS.filter((e) => e.decision === 'ALLOWED' || e.decision === 'APPROVED').length);
    const pending = pendingApprovals.length;
    const injectionCount = events.filter((e) => e.injection_detected).length + (INITIAL_STATS.injection_detected_count - INITIAL_EVENTS.filter((e) => e.injection_detected).length);

    const recentScores = events.slice(0, 20).map((e) => e.risk_score);
    const avgScore = recentScores.length > 0 ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length) : 31;

    let posture: 'NORMAL' | 'ELEVATED' | 'CRITICAL' = 'NORMAL';
    if (pending > 2 || reds > 75 || avgScore > 50) posture = 'CRITICAL';
    else if (pending > 0 || ambers > 190 || avgScore > 35) posture = 'ELEVATED';

    return {
      total_events: Math.max(total, events.length),
      green_count: Math.max(greens, 0),
      amber_count: Math.max(ambers, 0),
      red_count: Math.max(reds, 0),
      blocked_count: Math.max(blocked, 0),
      allowed_count: Math.max(allowed, 0),
      pending_count: pending,
      injection_detected_count: Math.max(injectionCount, 0),
      avg_risk_score: avgScore,
      active_agents_count: agents.filter((a) => a.status === 'active').length,
      security_posture: posture,
    };
  }, [events, pendingApprovals, agents]);

  const addEvent = useCallback((event: SecurityEvent) => {
    setEvents((prev) => [event, ...prev]);

    // Update Agent metrics
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === event.agent_id) {
          const updatedCalls = agent.total_calls + 1;
          const updatedViolations = event.risk_level === 'RED' ? agent.violations_count + 1 : agent.violations_count;
          const newTrend = [...agent.risk_trend.slice(1), event.risk_score];
          const newAvg = Math.round(newTrend.reduce((a, b) => a + b, 0) / newTrend.length);
          return {
            ...agent,
            total_calls: updatedCalls,
            last_action: event.tool_name,
            last_seen: 'Just now',
            avg_risk: newAvg,
            violations_count: updatedViolations,
            risk_trend: newTrend,
          };
        }
        return agent;
      })
    );

    // Notify user based on severity
    if (event.injection_detected) {
      addToast({
        title: '🔴 Prompt Injection Intercepted!',
        message: `Agent ${event.agent_id} attempted adversarial override via ${event.tool_name}`,
        type: 'security_red',
        eventId: event.id,
      });
    } else if (event.risk_level === 'RED') {
      addToast({
        title: '⛔ High-Risk Action Blocked',
        message: `${event.tool_name} (Risk ${event.risk_score}/100) automatically blocked by gateway`,
        type: 'error',
        eventId: event.id,
      });
    } else if (event.decision === 'PENDING_APPROVAL') {
      addToast({
        title: '🟡 Human Approval Required',
        message: `${event.tool_name} (Risk ${event.risk_score}) routed to SOC triage queue`,
        type: 'warning',
        eventId: event.id,
      });
    } else {
      addToast({
        title: '🟢 Tool Call Allowed',
        message: `${event.tool_name} passed zero-trust checks safely`,
        type: 'success',
      });
    }
  }, [addToast]);

  const approveEvent = useCallback((eventId: number | string, reviewerNote = 'Approved by SecOps Operator') => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const updatedTrail = [
            ...(e.audit_trail || []),
            {
              stage: 'Human Authorization',
              timestamp: new Date().toLocaleTimeString(),
              status: 'passed' as const,
              detail: `APPROVED by human operator: "${reviewerNote}"`,
            },
          ];
          return {
            ...e,
            decision: 'APPROVED',
            reviewer_note: reviewerNote,
            audit_trail: updatedTrail,
          };
        }
        return e;
      })
    );

    addToast({
      title: '✅ Action Approved',
      message: `Event #${eventId} marked as approved in audit log (simulated safe execution)`,
      type: 'success',
    });
  }, [addToast]);

  const rejectEvent = useCallback((eventId: number | string, reviewerNote = 'Denied by SecOps Operator') => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const updatedTrail = [
            ...(e.audit_trail || []),
            {
              stage: 'Human Authorization',
              timestamp: new Date().toLocaleTimeString(),
              status: 'critical' as const,
              detail: `DENIED by human operator: "${reviewerNote}"`,
            },
          ];
          return {
            ...e,
            decision: 'REJECTED',
            reviewer_note: reviewerNote,
            audit_trail: updatedTrail,
          };
        }
        return e;
      })
    );

    addToast({
      title: '❌ Action Denied',
      message: `Event #${eventId} rejected and halted permanently`,
      type: 'info',
    });
  }, [addToast]);

  const togglePolicy = useCallback((policyId: string) => {
    setPolicies((prev) =>
      prev.map((p) => {
        if (p.id === policyId) {
          const nextState = !p.is_active;
          addToast({
            title: nextState ? 'Policy Activated' : 'Policy Deactivated',
            message: `${p.name} is now ${nextState ? 'enforcing' : 'disabled'}`,
            type: nextState ? 'success' : 'warning',
          });
          return { ...p, is_active: nextState };
        }
        return p;
      })
    );
  }, [addToast]);

  const simulateToolCall = useCallback(
    async (toolName: string, params: ToolCallParameters, agentId = 'agent-runtime'): Promise<SecurityEvent> => {
      const event = await ApiService.intercept(toolName, params, agentId);
      addEvent(event);
      return event;
    },
    [addEvent]
  );

  const value = {
    events,
    agents,
    policies,
    stats,
    pendingApprovals,
    selectedEvent,
    selectedAgent,
    isSimulatorOpen,
    isWinningDemoOpen,
    activeTab,
    backendOnline,
    toasts,
    setActiveTab,
    setSelectedEvent,
    setSelectedAgent,
    setIsSimulatorOpen,
    setIsWinningDemoOpen,
    addEvent,
    approveEvent,
    rejectEvent,
    togglePolicy,
    simulateToolCall,
    addToast,
    removeToast,
    checkBackendHealth,
  };

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
