# ⚠️ WARNING — AgentGuard Development Rules

## 🚨 IMPORTANT

This project is a **4-hour hackathon prototype**. The priority is a **working, runnable product**, not unnecessary complexity.

The AI/developer must follow the rules below strictly.

---

# 🚫 DON'Ts

## 1. DON'T Build a Static Mockup

Do **not** create a frontend where buttons only change UI.

Every important action must perform real logic.

❌ Wrong:
- Fake risk score
- Fake approval button
- Fake activity logs
- Hardcoded dashboard results

✅ Correct:
- Real JSON interception
- Real policy evaluation
- Real database logging
- Real approval/rejection flow

---

## 2. DON'T Use Paid APIs

Do not make the core application dependent on:
- Paid LLM APIs
- Paid security APIs
- Paid cloud services
- Any API requiring a secret key

The project must work locally without an API key.

---

## 3. DON'T Use External Tools or Agents for Core Logic

Do not delegate the core security decision to another AI agent, external autonomous tool, or external security service.

The following must work locally:

```text
JSON Validation
      ↓
Risk Analysis
      ↓
Policy Engine
      ↓
Prompt Injection Detection
      ↓
GREEN / AMBER / RED
      ↓
Approval / Rejection
```

---

## 4. DON'T Execute Dangerous Agent Actions

AgentGuard is a security gateway.

NEVER actually execute incoming requests such as:

```text
drop_database_table
delete_database
delete_file
execute_shell_command
export_credentials
change_permissions
```

These actions must be **simulated safely**.

The application should demonstrate that the action was blocked/approved without performing destructive operations.

---

## 5. DON'T Expose Secrets

Never:
- Print API keys
- Display environment variables
- Store credentials in logs
- Commit `.env` files
- Put secrets directly in source code

Use:

```text
.env
.env.example
```

when configuration is required.

---

## 6. DON'T Overengineer

This is a 4-hour hackathon.

Avoid unnecessary:
- Microservices
- Kubernetes
- Docker orchestration
- Complex cloud infrastructure
- Large ML pipelines
- Complicated authentication systems
- Unnecessary databases

Prefer:

```text
Python
FastAPI
Pydantic
SQLite
Streamlit
```

---

## 7. DON'T Replace the Policy Engine With a Single LLM Prompt

Do not implement security as:

```text
"Is this action dangerous?"
```

using only an LLM.

The policy engine must contain deterministic, explainable rules.

It should return:

```text
Risk Score
Risk Level
Decision
Reasons
```

---

## 8. DON'T Use Only Simple Keyword Matching

Prompt-injection detection must not depend on one exact string such as:

```python
if "ignore" in text:
```

Use case-insensitive patterns/regex and multiple suspicious patterns.

The system should detect variations of:
- instruction override attempts
- system prompt extraction
- credential requests
- security bypass attempts

---

## 9. DON'T Break the Existing Architecture

Keep the project modular.

Recommended structure:

```text
backend/
├── main.py
├── models.py
├── database.py
├── policy_engine.py
├── risk_engine.py
└── injection_detector.py

frontend/
└── dashboard.py

simulator/
└── demo_agent.py

tests/
└── ...
```

Do not put the entire application into one huge file unless absolutely necessary.

---

## 10. DON'T Remove Working Features to Add Fancy Features

Priority order:

1. JSON interception
2. Policy engine
3. GREEN/AMBER/RED classification
4. Blocking
5. Human approval
6. SQLite logging
7. Dashboard
8. Prompt-injection detection
9. Demo simulator
10. UI polish

If time is limited, complete the features from the top first.

---

# ⚠️ SAFETY WARNING

AgentGuard is a **security demonstration system**.

Incoming agent actions are untrusted input.

Therefore:

- Validate every request.
- Never trust the agent.
- Never execute arbitrary code.
- Never execute arbitrary shell commands.
- Never execute destructive database operations.
- Never expose secrets.
- Never allow a tool-call to bypass the policy engine.
- Never allow a RED action to execute automatically.

Every tool call must follow:

```text
UNTRUSTED REQUEST
       ↓
VALIDATE
       ↓
ANALYZE
       ↓
CLASSIFY
       ↓
POLICY DECISION
       ↓
ALLOW / LOG / BLOCK
```

---

# ✅ MUST-HAVES

The final project MUST:

- Run locally.
- Have a working FastAPI backend.
- Have a working Streamlit dashboard.
- Accept real JSON requests.
- Validate incoming requests.
- Calculate a risk score.
- Classify GREEN / AMBER / RED.
- Block RED actions.
- Support human approval/rejection.
- Store activity in SQLite.
- Detect basic prompt injection.
- Include a demo simulator.
- Include automated tests.
- Include clear setup instructions.
- Work without paid API keys.

---

# 🏆 HACKATHON RULE

**Working Prototype > Fancy UI**

The judges should be able to see:

```text
AI Agent
   ↓
Tool Call
   ↓
AgentGuard
   ↓
Risk Analysis
   ↓
🔴 RED
   ↓
BLOCKED
   ↓
Human Approval
   ↓
APPROVE / REJECT
```

The complete flow must actually work.

---

# FINAL WARNING

Do not claim a feature is implemented unless it actually works.

Do not provide pseudocode where runnable code is required.

Do not leave core functions as:

```python
pass
```

or:

```python
# TODO: implement later
```

Before declaring the project complete, verify that:

```text
Backend starts
        ↓
API accepts JSON
        ↓
Policy engine responds
        ↓
Database records event
        ↓
Dashboard displays event
        ↓
RED request enters approval queue
        ↓
Approve/Reject works
        ↓
Tests pass
```

**Build a small, reliable, demonstrable security gateway rather than a large unfinished system.**
