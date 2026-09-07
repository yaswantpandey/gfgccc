export type RiskLevel = 'GREEN' | 'AMBER' | 'RED';

export type Decision = 
  | 'ALLOWED' 
  | 'BLOCKED' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'REJECTED';

export interface ToolCallParameters {
  [key: string]: any;
}

export interface InjectionResult {
  detected: boolean;
  patterns_matched: string[];
  score_contribution: number;
}

export interface RiskFactor {
  points: number;
  reason: string;
  category: 'tool' | 'param' | 'network' | 'filesystem' | 'injection' | 'policy';
}

export interface SecurityEvent {
  id: number | string;
  request_id?: string;
  tool_name: string;
  agent_id: string;
  agent_name?: string;
  parameters: ToolCallParameters;
  risk_score: number;
  risk_level: RiskLevel;
  decision: Decision;
  reasons: string[];
  injection_detected: boolean;
  injection_details?: InjectionResult;
  matched_policies?: string[];
  threat_signals?: string[];
  timestamp: string;
  reviewer_note?: string;
  execution_latency_ms?: number;
  audit_trail?: {
    stage: string;
    timestamp: string;
    status: 'passed' | 'warning' | 'critical' | 'info';
    detail: string;
  }[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  environment: 'Production' | 'Staging' | 'Development' | 'Sandbox';
  status: 'active' | 'quarantined' | 'idle';
  requests_per_min: number;
  total_calls: number;
  avg_risk: number;
  last_action: string;
  last_seen: string;
  violations_count: number;
  allowed_tools: string[];
  risk_trend: number[]; // sparkline data
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  action: 'BLOCK' | 'BLOCK + HUMAN APPROVAL' | 'REVIEW' | 'ALLOW';
  target_tools: string[];
  is_active: boolean;
  triggers_count: number;
  last_triggered?: string;
  rule_pattern: string;
}

export interface DashboardStats {
  total_events: number;
  green_count: number;
  amber_count: number;
  red_count: number;
  blocked_count: number;
  allowed_count: number;
  pending_count: number;
  injection_detected_count: number;
  avg_risk_score: number;
  active_agents_count: number;
  security_posture: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
}

export interface NotificationToast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'security_red';
  timestamp: string;
  eventId?: string | number;
}
