"""
AgentGuard — Pydantic models for request/response validation.
All incoming agent tool calls are validated against ToolCallRequest.
"""

from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from enum import Enum


class RiskLevel(str, Enum):
    GREEN = "GREEN"
    AMBER = "AMBER"
    RED = "RED"


class Decision(str, Enum):
    ALLOWED = "ALLOWED"
    BLOCKED = "BLOCKED"
    PENDING = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ToolCallRequest(BaseModel):
    """Incoming AI agent tool call intercepted by AgentGuard."""
    tool_name: str = Field(..., description="Name of the tool/action being called")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Tool parameters")
    agent_id: Optional[str] = Field(default="unknown_agent", description="Identifier of the calling agent")
    request_id: Optional[str] = Field(default=None, description="Optional unique request ID")


class InjectionResult(BaseModel):
    """Result of prompt injection analysis."""
    detected: bool
    patterns_matched: list[str]
    score_contribution: int


class RiskAnalysis(BaseModel):
    """Full risk analysis result from the risk + policy engines."""
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    decision: Decision
    reasons: list[str]
    injection_result: InjectionResult


class InterceptResponse(BaseModel):
    """Response returned to the agent after interception."""
    event_id: int
    tool_name: str
    risk_score: int
    risk_level: RiskLevel
    decision: Decision
    reasons: list[str]
    message: str


class ApprovalAction(BaseModel):
    """Human approval/rejection payload."""
    reviewer_note: Optional[str] = Field(default="", description="Optional note from the reviewer")


class EventRecord(BaseModel):
    """Serialized event record from the database."""
    id: int
    tool_name: str
    agent_id: str
    parameters: str          # JSON string
    risk_score: int
    risk_level: str
    decision: str
    reasons: str             # JSON string
    injection_detected: bool
    timestamp: str


class StatsResponse(BaseModel):
    """Dashboard statistics summary."""
    total_events: int
    green_count: int
    amber_count: int
    red_count: int
    blocked_count: int
    allowed_count: int
    pending_count: int
    injection_detected_count: int
