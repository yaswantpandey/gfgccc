"""
AgentGuard — Policy Engine.

Combines risk scoring and injection detection to produce a final
deterministic security decision. Returns:
  - risk_score  (0–100)
  - risk_level  (GREEN / AMBER / RED)
  - decision    (ALLOWED / PENDING_APPROVAL / BLOCKED)
  - reasons     (list of human-readable explanations)

Thresholds:
  0 – 30  → GREEN  → ALLOWED            (auto-allow)
  31 – 60 → AMBER  → PENDING_APPROVAL   (human review required)
  61+     → RED    → BLOCKED            (auto-block)

Any prompt injection detection immediately promotes to RED.
"""

from backend.risk_engine import score_tool_call
from backend.injection_detector import analyze_tool_call, InjectionResult
from backend.models import RiskLevel, Decision, RiskAnalysis

# Risk thresholds
GREEN_MAX = 30
AMBER_MAX = 60
# Anything above AMBER_MAX is RED


def evaluate(tool_name: str, parameters: dict) -> RiskAnalysis:
    """
    Full policy evaluation pipeline for a tool call.

    Args:
        tool_name: Name of the tool being called.
        parameters: Tool parameters dict.

    Returns:
        RiskAnalysis with risk_score, risk_level, decision, reasons.
    """
    # Step 1: Structural risk scoring
    base_score, reasons = score_tool_call(tool_name, parameters)

    # Step 2: Prompt injection detection
    injection: InjectionResult = analyze_tool_call(tool_name, parameters)
    if injection.detected:
        base_score = min(base_score + injection.score_contribution, 100)
        for category in injection.patterns_matched:
            reasons.append(
                f"[+{injection.score_contribution}] Prompt injection pattern detected: '{category}'"
            )

    # Step 3: Final classification
    # Force RED if injection detected, regardless of numeric score
    if injection.detected:
        risk_level = RiskLevel.RED
        decision = Decision.BLOCKED
        reasons.append("POLICY: Prompt injection → forced RED → AUTO-BLOCKED")
    elif base_score <= GREEN_MAX:
        risk_level = RiskLevel.GREEN
        decision = Decision.ALLOWED
        reasons.append("POLICY: Risk score ≤ 30 → GREEN → AUTO-ALLOWED")
    elif base_score <= AMBER_MAX:
        risk_level = RiskLevel.AMBER
        decision = Decision.PENDING
        reasons.append("POLICY: Risk score 31–60 → AMBER → PENDING HUMAN APPROVAL")
    else:
        risk_level = RiskLevel.RED
        decision = Decision.BLOCKED
        reasons.append("POLICY: Risk score > 60 → RED → AUTO-BLOCKED")

    return RiskAnalysis(
        risk_score=base_score,
        risk_level=risk_level,
        decision=decision,
        reasons=reasons,
        injection_result=_to_model_injection(injection),
    )


def _to_model_injection(inj: InjectionResult):
    """Convert NamedTuple to Pydantic model."""
    from backend.models import InjectionResult as ModelInjection
    return ModelInjection(
        detected=inj.detected,
        patterns_matched=inj.patterns_matched,
        score_contribution=inj.score_contribution,
    )
