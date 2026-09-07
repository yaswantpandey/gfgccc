"""
AgentGuard — Streamlit Live Dashboard

Run with:  streamlit run frontend/dashboard.py

Connects to FastAPI backend at http://localhost:8000
Auto-refreshes every 3 seconds using st.rerun() in a polling loop.
"""

import streamlit as st
import requests
import json
import time
from datetime import datetime

API_BASE = "http://localhost:8000"
REFRESH_INTERVAL = 3  # seconds

# ── Page config ────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="AgentGuard Security Dashboard",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ──────────────────────────────────────────────────────────────
st.markdown("""
<style>
/* Global dark background */
html, body, [class*="css"] {
    background-color: #0d1117;
    color: #e6edf3;
    font-family: 'Segoe UI', sans-serif;
}
/* Metric cards */
.metric-card {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 12px;
    padding: 16px 20px;
    text-align: center;
    margin-bottom: 10px;
}
.metric-card .value {
    font-size: 2.4rem;
    font-weight: 700;
}
.metric-card .label {
    font-size: 0.85rem;
    color: #8b949e;
    margin-top: 2px;
}
/* Risk badges */
.badge-GREEN  { background: #1a3a2a; color: #56d364; border: 1px solid #56d364; border-radius: 6px; padding: 2px 10px; font-weight: 600; }
.badge-AMBER  { background: #3a2e0a; color: #e3b341; border: 1px solid #e3b341; border-radius: 6px; padding: 2px 10px; font-weight: 600; }
.badge-RED    { background: #3a0a0a; color: #f85149; border: 1px solid #f85149; border-radius: 6px; padding: 2px 10px; font-weight: 600; }
.badge-BLOCKED    { background: #3a0a0a; color: #f85149; border-radius: 6px; padding: 2px 8px; }
.badge-ALLOWED    { background: #1a3a2a; color: #56d364; border-radius: 6px; padding: 2px 8px; }
.badge-PENDING    { background: #3a2e0a; color: #e3b341; border-radius: 6px; padding: 2px 8px; }
.badge-APPROVED   { background: #0a3a2a; color: #3fb950; border-radius: 6px; padding: 2px 8px; }
.badge-REJECTED   { background: #3a0a0a; color: #da3633; border-radius: 6px; padding: 2px 8px; }
/* Header */
.ag-header {
    display: flex; align-items: center; gap: 12px;
    background: linear-gradient(90deg, #161b22, #1c2128);
    border: 1px solid #30363d; border-radius: 12px;
    padding: 18px 24px; margin-bottom: 24px;
}
.ag-title { font-size: 1.8rem; font-weight: 800; color: #58a6ff; }
.ag-sub   { font-size: 0.85rem; color: #8b949e; }
</style>
""", unsafe_allow_html=True)


# ── Helper functions ────────────────────────────────────────────────────────

def api_get(path: str):
    try:
        r = requests.get(f"{API_BASE}{path}", timeout=5)
        r.raise_for_status()
        return r.json()
    except requests.ConnectionError:
        return None
    except Exception:
        return None


def api_post(path: str, payload: dict = None):
    try:
        r = requests.post(f"{API_BASE}{path}", json=payload or {}, timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": str(e)}


def risk_badge(level: str) -> str:
    icons = {"GREEN": "🟢", "AMBER": "🟡", "RED": "🔴"}
    icon = icons.get(level, "⚪")
    return f'<span class="badge-{level}">{icon} {level}</span>'


def decision_badge(decision: str) -> str:
    short = decision.replace("_APPROVAL", "").replace("_", " ")
    return f'<span class="badge-{decision.split("_")[0]}">{short}</span>'


def format_ts(ts: str) -> str:
    try:
        dt = datetime.fromisoformat(ts)
        return dt.strftime("%H:%M:%S")
    except Exception:
        return ts or "—"


# ── Check backend connectivity ──────────────────────────────────────────────

health = api_get("/health")
backend_online = health is not None

# ── Header ──────────────────────────────────────────────────────────────────

st.markdown("""
<div class="ag-header">
    <span style="font-size:2rem">🛡️</span>
    <div>
        <div class="ag-title">AgentGuard</div>
        <div class="ag-sub">AI Agent Security Gateway — Real-time Monitoring & Control</div>
    </div>
</div>
""", unsafe_allow_html=True)

if not backend_online:
    st.error("⚠️ **Backend not reachable.** Start it with: `uvicorn backend.main:app --reload`")
    st.stop()

# ── Sidebar ─────────────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown("## ⚙️ Controls")
    auto_refresh = st.toggle("Auto-refresh (3s)", value=True)
    if st.button("🔄 Refresh Now", use_container_width=True):
        st.rerun()
    st.markdown("---")
    st.markdown("### 📡 Backend")
    st.markdown(f"`{API_BASE}`")
    st.success("🟢 Online")
    st.markdown("---")
    st.markdown("### 🔑 Risk Thresholds")
    st.markdown("🟢 **GREEN** — 0 to 30")
    st.markdown("🟡 **AMBER** — 31 to 60")
    st.markdown("🔴 **RED** — 61+")
    st.markdown("---")
    st.markdown("### 📌 Legend")
    st.markdown("AUTO-ALLOWED — Score ≤ 30")
    st.markdown("PENDING — 31–60, needs review")
    st.markdown("BLOCKED — Score > 60 or injection")


# ── Stats Row ───────────────────────────────────────────────────────────────

stats = api_get("/stats") or {}

col1, col2, col3, col4, col5, col6 = st.columns(6)
with col1:
    st.markdown(f"""<div class="metric-card">
        <div class="value" style="color:#58a6ff">{stats.get('total_events', 0)}</div>
        <div class="label">Total Events</div></div>""", unsafe_allow_html=True)
with col2:
    st.markdown(f"""<div class="metric-card">
        <div class="value" style="color:#56d364">{stats.get('green_count', 0)}</div>
        <div class="label">🟢 GREEN</div></div>""", unsafe_allow_html=True)
with col3:
    st.markdown(f"""<div class="metric-card">
        <div class="value" style="color:#e3b341">{stats.get('amber_count', 0)}</div>
        <div class="label">🟡 AMBER</div></div>""", unsafe_allow_html=True)
with col4:
    st.markdown(f"""<div class="metric-card">
        <div class="value" style="color:#f85149">{stats.get('red_count', 0)}</div>
        <div class="label">🔴 RED</div></div>""", unsafe_allow_html=True)
with col5:
    st.markdown(f"""<div class="metric-card">
        <div class="value" style="color:#f85149">{stats.get('blocked_count', 0)}</div>
        <div class="label">🚫 Blocked</div></div>""", unsafe_allow_html=True)
with col6:
    st.markdown(f"""<div class="metric-card">
        <div class="value" style="color:#bc8cff">{stats.get('injection_detected_count', 0)}</div>
        <div class="label">💉 Injections</div></div>""", unsafe_allow_html=True)

st.markdown("---")

# ── Main Tabs ───────────────────────────────────────────────────────────────

tab_feed, tab_pending, tab_submit = st.tabs([
    "📋 Live Activity Feed",
    "⏳ Approval Queue",
    "🧪 Test Intercept",
])


# ── Tab 1: Live Feed ────────────────────────────────────────────────────────
with tab_feed:
    st.markdown("### 📋 Recent Agent Activity")
    events_data = api_get("/events?limit=50") or {}
    events = events_data.get("events", [])

    if not events:
        st.info("No events yet. Run the simulator or send a test request.")
    else:
        for ev in events:
            risk_level = ev.get("risk_level", "GREEN")
            decision = ev.get("decision", "ALLOWED")
            tool = ev.get("tool_name", "unknown")
            score = ev.get("risk_score", 0)
            agent = ev.get("agent_id", "unknown")
            ts = format_ts(ev.get("timestamp", ""))
            inj = "💉" if ev.get("injection_detected") else ""

            with st.expander(
                f"#{ev['id']}  {inj}  {tool}  |  Score: {score}  |  {risk_level}  |  {ts}",
                expanded=False,
            ):
                c1, c2, c3 = st.columns(3)
                with c1:
                    st.markdown(f"**Risk Level:** {risk_badge(risk_level)}", unsafe_allow_html=True)
                with c2:
                    st.markdown(f"**Decision:** {decision_badge(decision)}", unsafe_allow_html=True)
                with c3:
                    st.markdown(f"**Agent:** `{agent}`")

                st.markdown(f"**Risk Score:** `{score}/100`")

                # Reasons
                try:
                    reasons = json.loads(ev.get("reasons", "[]"))
                    if reasons:
                        st.markdown("**Reasons:**")
                        for r in reasons:
                            st.markdown(f"- {r}")
                except Exception:
                    pass

                # Parameters
                try:
                    params = json.loads(ev.get("parameters", "{}"))
                    st.json(params)
                except Exception:
                    st.text(ev.get("parameters", ""))


# ── Tab 2: Approval Queue ───────────────────────────────────────────────────
with tab_pending:
    st.markdown("### ⏳ Pending Human Approval")
    pending_data = api_get("/pending") or {}
    pending = pending_data.get("pending", [])

    if not pending:
        st.success("✅ No actions pending approval.")
    else:
        st.warning(f"**{len(pending)} action(s) awaiting your decision.**")
        for ev in pending:
            tool = ev.get("tool_name", "unknown")
            score = ev.get("risk_score", 0)
            risk_level = ev.get("risk_level", "AMBER")
            ev_id = ev["id"]
            agent = ev.get("agent_id", "unknown")
            ts = format_ts(ev.get("timestamp", ""))

            with st.container():
                st.markdown(f"""
                <div style="background:#1c2128;border:1px solid #e3b341;border-radius:10px;padding:16px;margin-bottom:12px">
                    <b>#{ev_id} — {tool}</b> &nbsp; {risk_badge(risk_level)}
                    <br><small style="color:#8b949e">Agent: {agent} &nbsp;|&nbsp; Score: {score}/100 &nbsp;|&nbsp; {ts}</small>
                </div>
                """, unsafe_allow_html=True)

                try:
                    reasons = json.loads(ev.get("reasons", "[]"))
                    for r in reasons:
                        st.markdown(f"  - {r}")
                except Exception:
                    pass

                try:
                    params = json.loads(ev.get("parameters", "{}"))
                    st.json(params)
                except Exception:
                    pass

                note = st.text_input("Reviewer note (optional)", key=f"note_{ev_id}")
                col_a, col_r = st.columns(2)
                with col_a:
                    if st.button(f"✅ Approve #{ev_id}", key=f"approve_{ev_id}", use_container_width=True):
                        result = api_post(f"/approve/{ev_id}", {"reviewer_note": note})
                        if "error" not in result:
                            st.success(result.get("message", "Approved"))
                            time.sleep(0.5)
                            st.rerun()
                        else:
                            st.error(result["error"])
                with col_r:
                    if st.button(f"❌ Reject #{ev_id}", key=f"reject_{ev_id}", use_container_width=True):
                        result = api_post(f"/reject/{ev_id}", {"reviewer_note": note})
                        if "error" not in result:
                            st.success(result.get("message", "Rejected"))
                            time.sleep(0.5)
                            st.rerun()
                        else:
                            st.error(result["error"])

                st.markdown("---")


# ── Tab 3: Manual Test Intercept ────────────────────────────────────────────
with tab_submit:
    st.markdown("### 🧪 Send a Test Tool Call")
    st.info("Manually submit a tool call to see AgentGuard's real-time policy decision.")

    with st.form("test_form"):
        tool_name = st.text_input("Tool Name", value="read_file")
        agent_id = st.text_input("Agent ID", value="test-agent-001")
        params_json = st.text_area(
            "Parameters (JSON)",
            value='{"path": "/home/user/document.txt"}',
            height=120,
        )
        submitted = st.form_submit_button("🚀 Intercept This Call", use_container_width=True)

    if submitted:
        try:
            params = json.loads(params_json)
        except json.JSONDecodeError as e:
            st.error(f"Invalid JSON in parameters: {e}")
            params = None

        if params is not None:
            payload = {
                "tool_name": tool_name,
                "agent_id": agent_id,
                "parameters": params,
            }
            result = api_post("/intercept", payload)
            if "error" in result:
                st.error(f"API Error: {result['error']}")
            else:
                level = result.get("risk_level", "GREEN")
                colors = {"GREEN": "#56d364", "AMBER": "#e3b341", "RED": "#f85149"}
                color = colors.get(level, "#58a6ff")

                st.markdown(f"""
                <div style="background:#161b22;border:2px solid {color};border-radius:12px;padding:20px;margin-top:12px">
                    <h3 style="color:{color}">
                        {'🟢' if level=='GREEN' else '🟡' if level=='AMBER' else '🔴'} {level} — Score: {result.get('risk_score')}/100
                    </h3>
                    <p><b>Decision:</b> {result.get('decision')}</p>
                    <p>{result.get('message')}</p>
                </div>
                """, unsafe_allow_html=True)

                st.markdown("**Policy Reasons:**")
                for r in result.get("reasons", []):
                    st.markdown(f"- {r}")


# ── Auto-refresh ────────────────────────────────────────────────────────────

if auto_refresh:
    time.sleep(REFRESH_INTERVAL)
    st.rerun()
