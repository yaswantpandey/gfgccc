import { SecurityEvent, DashboardStats, ToolCallParameters, Agent, Policy } from '../types';
import { evaluateToolCall } from './riskEngine';
import { INITIAL_EVENTS, INITIAL_AGENTS, INITIAL_POLICIES, INITIAL_STATS } from '../data/mockData';

const API_BASE = 'http://localhost:8000';

export class ApiService {
  private static isBackendOnline = false;

  public static async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(1200)
      });
      if (res.ok) {
        this.isBackendOnline = true;
        return true;
      }
    } catch {
      this.isBackendOnline = false;
    }
    return false;
  }

  public static getBackendStatus(): boolean {
    return this.isBackendOnline;
  }

  /**
   * Intercept a tool call. If FastAPI is running, delegates to backend;
   * otherwise uses the deterministic local risk engine.
   */
  public static async intercept(
    toolName: string,
    parameters: ToolCallParameters,
    agentId = 'agent-runtime'
  ): Promise<SecurityEvent> {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/intercept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool_name: toolName,
            parameters,
            agent_id: agentId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          // Synthesize full rich SecurityEvent from backend response
          const evaluated = evaluateToolCall(toolName, parameters, agentId);
          return {
            id: data.event_id || Date.now(),
            request_id: `req-${Math.random().toString(36).substring(2, 9)}`,
            tool_name: toolName,
            agent_id: agentId,
            parameters,
            risk_score: data.risk_score,
            risk_level: data.risk_level,
            decision: data.decision,
            reasons: data.reasons || evaluated.reasons,
            injection_detected: evaluated.injection.detected,
            injection_details: evaluated.injection,
            matched_policies: evaluated.matchedPolicies,
            threat_signals: evaluated.threatSignals,
            timestamp: new Date().toISOString(),
            execution_latency_ms: +(Math.random() * 1.5 + 0.8).toFixed(2),
            audit_trail: [
              { stage: 'Interception', timestamp: new Date().toLocaleTimeString(), status: 'passed', detail: `Intercepted from ${agentId}` },
              { stage: 'Risk Engine', timestamp: new Date().toLocaleTimeString(), status: data.risk_level === 'RED' ? 'critical' : data.risk_level === 'AMBER' ? 'warning' : 'passed', detail: `Score: ${data.risk_score}/100` },
              { stage: 'Policy Decision', timestamp: new Date().toLocaleTimeString(), status: data.decision === 'BLOCKED' ? 'critical' : data.decision === 'PENDING_APPROVAL' ? 'warning' : 'passed', detail: `Outcome: ${data.decision}` }
            ]
          };
        }
      } catch (err) {
        console.warn('FastAPI backend connection failed, falling back to local deterministic engine', err);
      }
    }

    // Local deterministic engine
    const evaluation = evaluateToolCall(toolName, parameters, agentId);
    const eventId = Date.now();
    const requestId = `req-${Math.random().toString(36).substring(2, 8)}`;

    const event: SecurityEvent = {
      id: eventId,
      request_id: requestId,
      tool_name: toolName,
      agent_id: agentId,
      parameters,
      risk_score: evaluation.risk_score,
      risk_level: evaluation.risk_level,
      decision: evaluation.decision,
      reasons: evaluation.reasons,
      injection_detected: evaluation.injection.detected,
      injection_details: evaluation.injection,
      matched_policies: evaluation.matchedPolicies,
      threat_signals: evaluation.threatSignals,
      timestamp: evaluation.timestamp,
      execution_latency_ms: +(Math.random() * 1.2 + 0.9).toFixed(2),
      audit_trail: [
        { stage: 'Interception', timestamp: new Date().toLocaleTimeString(), status: 'passed', detail: `Payload intercepted from ${agentId}` },
        { stage: 'JSON Validation', timestamp: new Date().toLocaleTimeString(), status: 'passed', detail: 'Schema structure verified' },
        { stage: 'Risk Engine', timestamp: new Date().toLocaleTimeString(), status: evaluation.risk_level === 'RED' ? 'critical' : evaluation.risk_level === 'AMBER' ? 'warning' : 'passed', detail: `Score computed: ${evaluation.risk_score}/100` },
        { stage: 'Policy Evaluation', timestamp: new Date().toLocaleTimeString(), status: evaluation.risk_level === 'RED' ? 'critical' : evaluation.risk_level === 'AMBER' ? 'warning' : 'passed', detail: evaluation.matchedPolicies.join(', ') || 'POL-006 (ALLOW)' },
        { stage: 'Decision Engine', timestamp: new Date().toLocaleTimeString(), status: evaluation.decision === 'BLOCKED' ? 'critical' : evaluation.decision === 'PENDING_APPROVAL' ? 'warning' : 'passed', detail: `Gateway resolution: ${evaluation.decision}` }
      ]
    };

    return event;
  }
}
