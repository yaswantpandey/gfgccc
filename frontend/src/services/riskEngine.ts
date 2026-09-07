import { RiskLevel, Decision, ToolCallParameters, InjectionResult, RiskFactor } from '../types';

const DANGEROUS_TOOL_PATTERNS = /(?:drop_database|delete_database|delete_table|truncate_table|drop_table|delete_file|remove_file|\bunlink\b|execute_shell|run_command|exec_command|shell_exec|run_script|execute_script|export_credentials|exfiltrate|dump_database|change_permissions|\bchmod\b|\bchown\b|format_disk|wipe_disk|disable_security|bypass_auth|send_email_bulk|mass_delete|bulk_delete)/i;

const CREDENTIAL_PARAM_PATTERNS = /(password|passwd|api[_\-]?key|secret|token|credential|private[_\-]?key|access[_\-]?key|auth[_\-]?token|ssh[_\-]?key|bearer|passphrase|pin|otp)/i;

const EXTERNAL_URL_PATTERNS = /https?:\/\/[^\s"'<>]+/i;

const FILESYSTEM_PATH_PATTERNS = /(\/etc\/|\/var\/|\/home\/|\/root\/|\/sys\/|\/proc\/|\/tmp\/|C:\\Windows\\|C:\\Users\\|C:\\Program|\.\.[\\\/]|\/etc\/passwd|\/etc\/shadow|\.ssh\/|\.aws\/|\.env)/i;

const KNOWN_SAFE_TOOLS = new Set([
  'read_file', 'list_files', 'get_user_info', 'fetch_weather',
  'search_web', 'get_time', 'get_date', 'calculate', 'translate',
  'summarize', 'get_news', 'send_message', 'create_note',
  'get_calendar', 'set_reminder', 'get_stock_price',
]);

const INJECTION_PATTERNS: { category: string; regex: RegExp; points: number }[] = [
  {
    category: 'Instruction Override Attempt',
    regex: /(ignore\s+(all\s+)?(previous|prior|above)\s+instructions|disregard\s+(all\s+)?(previous|prior)\s+rules|forget\s+all\s+previous\s+prompts|new\s+instructions\s+follow|start\s+fresh\s+now)/i,
    points: 35,
  },
  {
    category: 'System Prompt Extraction',
    regex: /(reveal|display|output|print|show|leak)\s+(your\s+)?(system\s+prompt|initial\s+instructions|system\s+message|internal\s+configuration|hidden\s+prompt)/i,
    points: 30,
  },
  {
    category: 'Jailbreak / Unrestricted Persona',
    regex: /(DAN\s+mode|jailbreak|developer\s+mode\s+enabled|act\s+as\s+an\s+unrestricted\s+AI|pretend\s+you\s+have\s+no\s+safety\s+filters|bypass\s+all\s+guidelines)/i,
    points: 40,
  },
  {
    category: 'Security Control Bypass',
    regex: /(bypass\s+(auth|security|filter|guardrail)|disable\s+safety\s+checks|override\s+policy|simulate\s+admin\s+privileges)/i,
    points: 35,
  },
  {
    category: 'Direct Credential Extraction',
    regex: /(give\s+me\s+the\s+(password|api\s*key|root\s*token)|dump\s+all\s+secrets|extract\s+environment\s+variables)/i,
    points: 35,
  },
];

function extractParamInfo(parameters: ToolCallParameters): { keys: string[]; text: string } {
  const keys: string[] = [];
  const values: string[] = [];

  function recurse(obj: any, depth = 0) {
    if (depth > 5 || obj === null || obj === undefined) {
      values.push(String(obj));
      return;
    }
    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        for (const item of obj) {
          recurse(item, depth + 1);
        }
      } else {
        for (const [k, v] of Object.entries(obj)) {
          keys.push(k);
          recurse(v, depth + 1);
        }
      }
    } else {
      values.push(String(obj));
    }
  }

  recurse(parameters);
  return { keys, text: values.join(' ') };
}

export function detectPromptInjection(toolName: string, parameters: ToolCallParameters): InjectionResult {
  const { text } = extractParamInfo(parameters);
  const targetText = `${toolName} ${text}`;

  const matchedPatterns: string[] = [];
  let scoreContribution = 0;

  for (const item of INJECTION_PATTERNS) {
    if (item.regex.test(targetText)) {
      matchedPatterns.push(item.category);
      scoreContribution = Math.max(scoreContribution, item.points);
    }
  }

  return {
    detected: matchedPatterns.length > 0,
    patterns_matched: matchedPatterns,
    score_contribution: matchedPatterns.length > 0 ? (scoreContribution || 30) : 0,
  };
}

export function evaluateToolCall(toolName: string, parameters: ToolCallParameters, agentId = 'agent-runtime') {
  const factors: RiskFactor[] = [];
  const reasons: string[] = [];
  const threatSignals: string[] = [];
  const matchedPolicies: string[] = [];

  let rawScore = 0;

  // 1. Dangerous action pattern in tool name
  if (DANGEROUS_TOOL_PATTERNS.test(toolName)) {
    const points = 65;
    rawScore += points;
    factors.push({ points, reason: `Dangerous action keyword detected in tool name: '${toolName}'`, category: 'tool' });
    reasons.push(`[+${points}] Dangerous action keyword: '${toolName}'`);
    threatSignals.push('Destructive Tool Invocation');
    matchedPolicies.push('DESTRUCTIVE_OPERATIONS_POLICY');
  } else if (!KNOWN_SAFE_TOOLS.has(toolName.toLowerCase())) {
    const points = 10;
    rawScore += points;
    factors.push({ points, reason: `Tool '${toolName}' is not in the known-safe catalog`, category: 'tool' });
    reasons.push(`[+${points}] Unknown/Unverified tool: '${toolName}'`);
  }

  // 2. Parameter scanning
  const { keys, text } = extractParamInfo(parameters);

  for (const key of keys) {
    if (CREDENTIAL_PARAM_PATTERNS.test(key)) {
      const points = 25;
      rawScore += points;
      factors.push({ points, reason: `Credential-sensitive parameter detected: '${key}'`, category: 'param' });
      reasons.push(`[+${points}] Credential parameter match: '${key}'`);
      threatSignals.push('Credential Exposure Risk');
      matchedPolicies.push('CREDENTIAL_PROTECTION_POLICY');
      break;
    }
  }

  if (EXTERNAL_URL_PATTERNS.test(text)) {
    const points = 20;
    rawScore += points;
    factors.push({ points, reason: 'External network URL found in parameter payload', category: 'network' });
    reasons.push(`[+${points}] Outbound URL detected in arguments`);
    threatSignals.push('External Network Egress');
    matchedPolicies.push('EXTERNAL_EXFILTRATION_MONITOR');
  }

  if (FILESYSTEM_PATH_PATTERNS.test(text)) {
    const points = 15;
    rawScore += points;
    factors.push({ points, reason: 'Restricted filesystem or sensitive path detected in arguments', category: 'filesystem' });
    reasons.push(`[+${points}] System/Filesystem path parameter match`);
    threatSignals.push('Filesystem Traversal/Access');
    matchedPolicies.push('SYSTEM_RESOURCE_ISOLATION');
  }

  // 3. Prompt injection detection
  const injection = detectPromptInjection(toolName, parameters);
  if (injection.detected) {
    const points = injection.score_contribution;
    rawScore += points;
    for (const pattern of injection.patterns_matched) {
      factors.push({ points, reason: `Prompt injection pattern detected: '${pattern}'`, category: 'injection' });
      reasons.push(`[+${points}] Prompt injection signature: '${pattern}'`);
    }
    threatSignals.push('Prompt Injection Adversarial Pattern');
    matchedPolicies.push('PROMPT_INJECTION_SHIELD');
  }

  const finalScore = Math.min(100, Math.max(0, rawScore));

  let riskLevel: RiskLevel;
  let decision: Decision;

  if (injection.detected) {
    riskLevel = 'RED';
    decision = 'BLOCKED';
    reasons.push('POLICY DECISION: Adversarial Prompt Injection detected → FORCED RED → AUTO-BLOCKED');
  } else if (finalScore <= 30) {
    riskLevel = 'GREEN';
    decision = 'ALLOWED';
    reasons.push('POLICY DECISION: Risk score ≤ 30 → GREEN → AUTO-ALLOWED by AgentGuard');
  } else if (finalScore <= 60) {
    riskLevel = 'AMBER';
    decision = 'PENDING_APPROVAL';
    reasons.push('POLICY DECISION: Risk score 31–60 → AMBER → PENDING HUMAN APPROVAL');
  } else {
    riskLevel = 'RED';
    decision = 'BLOCKED';
    reasons.push('POLICY DECISION: Risk score > 60 → RED → AUTO-BLOCKED by Security Gateway');
  }

  const now = new Date().toISOString();

  return {
    risk_score: finalScore,
    risk_level: riskLevel,
    decision,
    reasons,
    factors,
    threatSignals,
    matchedPolicies,
    injection,
    timestamp: now,
  };
}
