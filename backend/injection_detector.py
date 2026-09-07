"""
AgentGuard — Prompt Injection Detector.

Uses case-insensitive regex patterns across multiple attack categories.
Does NOT rely on a single keyword match — detects variations of each attack.
"""

import re
from typing import NamedTuple

# Score contribution if any injection is found
INJECTION_SCORE_CONTRIBUTION = 30

# Each entry: (category_label, compiled_regex_pattern)
INJECTION_PATTERNS: list[tuple[str, re.Pattern]] = [
    # --- Instruction override attempts ---
    ("instruction_override", re.compile(
        r"ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|rules?|prompts?)"
        r"|disregard\s+(all\s+)?(previous|prior|above|your)?\s*(instructions?|rules?|guidelines?|directives?)"
        r"|forget\s+(everything|all|previous|prior|what|your)"
        r"|override\s+(your\s+)?(instructions?|system|prompt|rules?)"
        r"|from\s+now\s+on\s+(you\s+are|act|behave|ignore)"
        r"|new\s+(instructions?|rules?|prompt|directive|order):",
        re.IGNORECASE,
    )),

    # --- System prompt extraction ---
    ("system_prompt_extraction", re.compile(
        # e.g. "show me your original instructions", "reveal the system prompt"
        r"(reveal|show|print|display|output|repeat|tell\s+me|give\s+me)"
        r"\s+(?:\w+\s+){0,3}"   # allow up to 3 optional words before target
        r"(system\s+prompt|initial\s+prompt|original\s+prompt|instructions?|configuration|directives?|rules?)"
        r"|what\s+(are|is)\s+your\s+(system\s+prompt|instructions?|rules?|directives?)"
        r"|dump\s+(your\s+)?(system|prompt|context|memory)"
        r"|(leak|expose)\s+(the\s+)?(system\s+prompt|prompt|instructions?)",
        re.IGNORECASE,
    )),

    # --- Credential / secret theft ---
    ("credential_theft", re.compile(
        r"(send|export|share|give|reveal|show|email|upload|transmit)\s+"
        r"(me\s+)?(the\s+)?(password|api.?key|secret|token|credential|auth|private.?key|"
        r"access.?key|ssh.?key|certificate)|"
        r"(exfiltrate|steal|extract)\s+(data|credentials?|keys?|secrets?)|"
        r"(what\s+is|tell\s+me)\s+(the\s+)?(password|secret|api.?key|token)",
        re.IGNORECASE,
    )),

    # --- Security bypass attempts ---
    ("security_bypass", re.compile(
        r"jailbreak|"
        r"bypass\s+(security|filter|guard|restriction|policy|limit)|"
        r"(act|behave|pretend|roleplay|imagine)\s+(as|like|you\s+are|you're)\s+"
        r"(a\s+)?(different|uncensored|unrestricted|free|evil|rogue|hacked)|"
        r"you\s+(have\s+no|don'?t\s+have\s+any)\s+(restrictions?|limits?|rules?|filters?)|"
        r"DAN\s*mode|developer\s+mode|god\s+mode|unrestricted\s+mode",
        re.IGNORECASE,
    )),

    # --- Indirect injection via data ---
    ("indirect_injection", re.compile(
        r"<\s*script\s*>|"
        r"\{\{.*\}\}|"                     # template injection
        r"<!--.*?-->|"                     # HTML comment injection
        r"system:\s*(you\s+are|ignore|new\s+instructions?)|"
        r"\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>",  # model-specific delimiters
        re.IGNORECASE,
    )),
]


class InjectionResult(NamedTuple):
    detected: bool
    patterns_matched: list[str]
    score_contribution: int


def detect_injection(text: str) -> InjectionResult:
    """
    Analyze a string for prompt injection signals.

    Args:
        text: The raw text to analyze (tool name + parameters combined).

    Returns:
        InjectionResult with detection flag, matched categories, and score.
    """
    matched_categories: list[str] = []

    for category, pattern in INJECTION_PATTERNS:
        if pattern.search(text):
            matched_categories.append(category)

    detected = len(matched_categories) > 0
    return InjectionResult(
        detected=detected,
        patterns_matched=matched_categories,
        score_contribution=INJECTION_SCORE_CONTRIBUTION if detected else 0,
    )


def analyze_tool_call(tool_name: str, parameters: dict) -> InjectionResult:
    """
    Analyze a full tool call (name + all parameter values) for injection.

    Args:
        tool_name: The tool name string.
        parameters: The tool parameters dict.

    Returns:
        InjectionResult.
    """
    # Flatten all parameter values to a single searchable text blob
    param_text = " ".join(
        str(v) for v in _flatten_values(parameters)
    )
    combined_text = f"{tool_name} {param_text}"
    return detect_injection(combined_text)


def _flatten_values(obj, depth: int = 0) -> list:
    """Recursively extract all leaf values from a nested dict/list."""
    if depth > 5:
        return [str(obj)]
    if isinstance(obj, dict):
        result = []
        for v in obj.values():
            result.extend(_flatten_values(v, depth + 1))
        return result
    elif isinstance(obj, list):
        result = []
        for item in obj:
            result.extend(_flatten_values(item, depth + 1))
        return result
    else:
        return [obj]
