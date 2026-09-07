"""
AgentGuard — Risk Engine.

Calculates a deterministic numeric risk score (0–100) based on
structural analysis of the tool call. No LLM involved.

Scoring factors:
  +40  Dangerous action keyword in tool name
  +25  Credential-related parameter names
  +20  External URL in parameter values
  +15  Filesystem / system path in parameter values
  +10  Unknown / unrecognized tool name
  +30  Prompt injection detected (added by policy_engine after injection check)
  [capped at 100]
"""

import re
from typing import Any

# ---------------------------------------------------------------------------
# Dangerous tool name keywords  (exact or substring match, case-insensitive)
# ---------------------------------------------------------------------------
DANGEROUS_ACTION_PATTERNS = re.compile(
    r"(?:"
    r"drop_database|delete_database|delete_table|truncate_table|"
    r"drop_table|delete_file|remove_file|\bunlink\b|"
    r"execute_shell|run_command|exec_command|shell_exec|"
    r"run_script|execute_script|"
    r"export_credentials|exfiltrate|dump_database|"
    r"change_permissions|\bchmod\b|\bchown\b|"
    r"format_disk|wipe_disk|"
    r"disable_security|bypass_auth|"
    r"send_email_bulk|mass_delete|bulk_delete"
    r")",
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# Credential-related parameter names
# ---------------------------------------------------------------------------
CREDENTIAL_PARAM_PATTERN = re.compile(
    r"(password|passwd|api[_\-]?key|secret|token|credential|"
    r"private[_\-]?key|access[_\-]?key|auth[_\-]?token|ssh[_\-]?key|"
    r"bearer|passphrase|pin|otp)",
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# External URL pattern
# ---------------------------------------------------------------------------
EXTERNAL_URL_PATTERN = re.compile(
    r"https?://[^\s\"'<>]+",
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# Filesystem / system path pattern
# ---------------------------------------------------------------------------
FILESYSTEM_PATH_PATTERN = re.compile(
    r"(/etc/|/var/|/home/|/root/|/sys/|/proc/|/tmp/|"
    r"C:\\Windows\\|C:\\Users\\|C:\\Program|"
    r"\.\.[\\/]|"                   # directory traversal
    r"/etc/passwd|/etc/shadow|"
    r"\.ssh/|\.aws/|\.env)",
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# Known "safe" tool names that start with 0 base risk
# ---------------------------------------------------------------------------
KNOWN_SAFE_TOOLS = {
    "read_file", "list_files", "get_user_info", "fetch_weather",
    "search_web", "get_time", "get_date", "calculate", "translate",
    "summarize", "get_news", "send_message", "create_note",
    "get_calendar", "set_reminder", "get_stock_price",
}


class RiskFactors:
    """Container for individual risk factor scores and reasons."""

    def __init__(self):
        self.score: int = 0
        self.reasons: list[str] = []

    def add(self, points: int, reason: str) -> None:
        self.score += points
        self.reasons.append(f"[+{points}] {reason}")

    def total(self) -> int:
        return min(self.score, 100)


def score_tool_call(tool_name: str, parameters: dict[str, Any]) -> tuple[int, list[str]]:
    """
    Compute a risk score for a tool call.

    Args:
        tool_name: Name of the tool being called.
        parameters: Parameters dict.

    Returns:
        (risk_score 0–100, list_of_reasons)
    """
    factors = RiskFactors()

    # 1. Dangerous action keyword in tool name
    if DANGEROUS_ACTION_PATTERNS.search(tool_name):
        factors.add(65, f"Dangerous action keyword detected in tool name: '{tool_name}'")

    # 2. Unknown tool
    if tool_name.lower() not in KNOWN_SAFE_TOOLS and not DANGEROUS_ACTION_PATTERNS.search(tool_name):
        factors.add(10, f"Tool '{tool_name}' is not in the known-safe list")

    # Flatten params for text scanning
    param_keys, param_values_text = _extract_param_info(parameters)

    # 3. Credential-related parameter names
    for key in param_keys:
        if CREDENTIAL_PARAM_PATTERN.search(key):
            factors.add(25, f"Credential-sensitive parameter name detected: '{key}'")
            break  # count once per call

    # 4. External URL in parameter values
    if EXTERNAL_URL_PATTERN.search(param_values_text):
        factors.add(20, "External URL found in parameter values")

    # 5. Filesystem / system path in parameter values
    if FILESYSTEM_PATH_PATTERN.search(param_values_text):
        factors.add(15, "System/filesystem path detected in parameter values")

    return factors.total(), factors.reasons


def _extract_param_info(parameters: dict) -> tuple[list[str], str]:
    """
    Recursively extract all parameter keys and stringify all values.

    Returns:
        (list_of_all_keys, concatenated_values_string)
    """
    keys: list[str] = []
    values: list[str] = []
    _recurse(parameters, keys, values, depth=0)
    return keys, " ".join(values)


def _recurse(obj: Any, keys: list, values: list, depth: int) -> None:
    if depth > 5:
        values.append(str(obj))
        return
    if isinstance(obj, dict):
        for k, v in obj.items():
            keys.append(str(k))
            _recurse(v, keys, values, depth + 1)
    elif isinstance(obj, list):
        for item in obj:
            _recurse(item, keys, values, depth + 1)
    else:
        values.append(str(obj))
