"""
AgentGuard — FastAPI Backend
Entry point: uvicorn backend.main:app --reload --port 8000

All routes follow:
  UNTRUSTED REQUEST → VALIDATE → ANALYZE → CLASSIFY → POLICY DECISION → ALLOW/LOG/BLOCK
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid

from backend.models import (
    ToolCallRequest,
    InterceptResponse,
    ApprovalAction,
    StatsResponse,
    Decision,
    RiskLevel,
)
from backend import database as db
from backend.policy_engine import evaluate

app = FastAPI(
    title="AgentGuard",
    description="AI Agent Security Gateway — intercepts, analyzes, and controls agent tool calls.",
    version="1.0.0",
)

# Allow Streamlit dashboard (same machine) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Initialize the database on startup."""
    db.init_db()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health", tags=["System"])
def health_check():
    """Simple liveness check."""
    return {"status": "ok", "service": "AgentGuard"}


# ---------------------------------------------------------------------------
# Core interception endpoint
# ---------------------------------------------------------------------------

@app.post("/intercept", response_model=InterceptResponse, tags=["Security"])
def intercept_tool_call(request: ToolCallRequest):
    """
    Intercept an incoming AI agent tool call.

    The full pipeline runs here:
      1. JSON Validation (Pydantic)
      2. Risk Scoring
      3. Prompt Injection Detection
      4. Policy Decision (GREEN / AMBER / RED)
      5. SQLite Logging
      6. Response to agent
    """
    # Assign a request_id if not provided
    if not request.request_id:
        request.request_id = str(uuid.uuid4())

    # Run the full policy evaluation pipeline
    analysis = evaluate(request.tool_name, request.parameters)

    # Log the event to SQLite
    event_id = db.log_event(
        tool_name=request.tool_name,
        agent_id=request.agent_id or "unknown",
        parameters=request.parameters,
        risk_score=analysis.risk_score,
        risk_level=analysis.risk_level.value,
        decision=analysis.decision.value,
        reasons=analysis.reasons,
        injection_detected=analysis.injection_result.detected,
    )

    # Build human-readable message
    emoji_map = {
        RiskLevel.GREEN: "🟢",
        RiskLevel.AMBER: "🟡",
        RiskLevel.RED: "🔴",
    }
    decision_messages = {
        Decision.ALLOWED: "Action AUTO-ALLOWED by AgentGuard.",
        Decision.PENDING: "Action requires HUMAN APPROVAL. Queued for review.",
        Decision.BLOCKED: "Action AUTO-BLOCKED by AgentGuard. Dangerous or injected.",
    }

    return InterceptResponse(
        event_id=event_id,
        tool_name=request.tool_name,
        risk_score=analysis.risk_score,
        risk_level=analysis.risk_level,
        decision=analysis.decision,
        reasons=analysis.reasons,
        message=f"{emoji_map[analysis.risk_level]} {decision_messages[analysis.decision]}",
    )


# ---------------------------------------------------------------------------
# Event log
# ---------------------------------------------------------------------------

@app.get("/events", tags=["Logs"])
def get_events(limit: int = 100):
    """Fetch the most recent intercepted events."""
    events = db.get_all_events(limit=limit)
    return {"events": events, "count": len(events)}


@app.get("/events/{event_id}", tags=["Logs"])
def get_event(event_id: int):
    """Fetch a single event by ID."""
    event = db.get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    return event


# ---------------------------------------------------------------------------
# Approval queue
# ---------------------------------------------------------------------------

@app.get("/pending", tags=["Approval"])
def get_pending():
    """Fetch all events awaiting human approval (AMBER / queued RED)."""
    events = db.get_pending_events()
    return {"pending": events, "count": len(events)}


@app.post("/approve/{event_id}", tags=["Approval"])
def approve_event(event_id: int, action: ApprovalAction = ApprovalAction()):
    """
    Human approves a PENDING_APPROVAL event.
    The action is recorded as APPROVED. It is NOT executed — this is a simulation.
    """
    event = db.get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")

    if event["decision"] not in ("PENDING_APPROVAL",):
        raise HTTPException(
            status_code=400,
            detail=f"Event {event_id} is not pending approval (current: {event['decision']})",
        )

    updated = db.update_decision(event_id, Decision.APPROVED.value, action.reviewer_note)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update event")

    return {
        "event_id": event_id,
        "decision": "APPROVED",
        "message": "✅ Event approved by human reviewer. Action marked as approved (simulated — not executed).",
        "reviewer_note": action.reviewer_note,
    }


@app.post("/reject/{event_id}", tags=["Approval"])
def reject_event(event_id: int, action: ApprovalAction = ApprovalAction()):
    """
    Human rejects a PENDING_APPROVAL event.
    The action is recorded as REJECTED and will not be executed.
    """
    event = db.get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")

    if event["decision"] not in ("PENDING_APPROVAL",):
        raise HTTPException(
            status_code=400,
            detail=f"Event {event_id} is not pending approval (current: {event['decision']})",
        )

    updated = db.update_decision(event_id, Decision.REJECTED.value, action.reviewer_note)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update event")

    return {
        "event_id": event_id,
        "decision": "REJECTED",
        "message": "❌ Event rejected by human reviewer. Action blocked.",
        "reviewer_note": action.reviewer_note,
    }


# ---------------------------------------------------------------------------
# Statistics
# ---------------------------------------------------------------------------

@app.get("/stats", response_model=StatsResponse, tags=["Dashboard"])
def get_stats():
    """Return aggregate statistics for the dashboard."""
    stats = db.get_stats()
    return StatsResponse(**stats)
