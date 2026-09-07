"""
AgentGuard — SQLite database layer.
Uses Python's built-in sqlite3; no ORM needed for a hackathon prototype.
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "agentguard.db")


def get_connection() -> sqlite3.Connection:
    """Return a thread-safe SQLite connection with row_factory."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create tables if they do not exist."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                tool_name           TEXT    NOT NULL,
                agent_id            TEXT    NOT NULL DEFAULT 'unknown',
                parameters          TEXT    NOT NULL DEFAULT '{}',
                risk_score          INTEGER NOT NULL DEFAULT 0,
                risk_level          TEXT    NOT NULL DEFAULT 'GREEN',
                decision            TEXT    NOT NULL DEFAULT 'ALLOWED',
                reasons             TEXT    NOT NULL DEFAULT '[]',
                injection_detected  INTEGER NOT NULL DEFAULT 0,
                reviewer_note       TEXT    DEFAULT '',
                timestamp           TEXT    NOT NULL
            )
        """)
        conn.commit()
    finally:
        conn.close()


def log_event(
    tool_name: str,
    agent_id: str,
    parameters: dict,
    risk_score: int,
    risk_level: str,
    decision: str,
    reasons: list,
    injection_detected: bool,
) -> int:
    """Insert a new event and return its auto-incremented ID."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO events
                (tool_name, agent_id, parameters, risk_score, risk_level,
                 decision, reasons, injection_detected, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                tool_name,
                agent_id,
                json.dumps(parameters),
                risk_score,
                risk_level,
                decision,
                json.dumps(reasons),
                int(injection_detected),
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def update_decision(event_id: int, decision: str, reviewer_note: str = "") -> bool:
    """Update the decision for an existing event (approve/reject)."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE events SET decision = ?, reviewer_note = ? WHERE id = ?",
            (decision, reviewer_note, event_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def get_all_events(limit: int = 100) -> list[dict]:
    """Fetch the most recent events."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM events ORDER BY id DESC LIMIT ?",
            (limit,),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def get_pending_events() -> list[dict]:
    """Fetch all events awaiting human approval."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM events WHERE decision = 'PENDING_APPROVAL' ORDER BY id ASC"
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def get_event_by_id(event_id: int) -> Optional[dict]:
    """Fetch a single event by ID."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_stats() -> dict:
    """Return aggregate statistics for the dashboard."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) AS total FROM events")
        total = cursor.fetchone()["total"]

        cursor.execute("SELECT risk_level, COUNT(*) AS cnt FROM events GROUP BY risk_level")
        level_counts = {row["risk_level"]: row["cnt"] for row in cursor.fetchall()}

        cursor.execute("SELECT decision, COUNT(*) AS cnt FROM events GROUP BY decision")
        decision_counts = {row["decision"]: row["cnt"] for row in cursor.fetchall()}

        cursor.execute(
            "SELECT COUNT(*) AS cnt FROM events WHERE injection_detected = 1"
        )
        injection_count = cursor.fetchone()["cnt"]

        return {
            "total_events": total,
            "green_count": level_counts.get("GREEN", 0),
            "amber_count": level_counts.get("AMBER", 0),
            "red_count": level_counts.get("RED", 0),
            "blocked_count": decision_counts.get("BLOCKED", 0),
            "allowed_count": decision_counts.get("ALLOWED", 0),
            "pending_count": decision_counts.get("PENDING_APPROVAL", 0),
            "approved_count": decision_counts.get("APPROVED", 0),
            "rejected_count": decision_counts.get("REJECTED", 0),
            "injection_detected_count": injection_count,
        }
    finally:
        conn.close()
