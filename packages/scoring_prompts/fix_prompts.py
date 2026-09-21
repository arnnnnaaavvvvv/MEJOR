from typing import List
from packages.shared.schemas import Issue

def generate_issue_prompt(issue: Issue) -> str:
    loc = issue.location
    bbox_str = ""
    if loc.bounding_box:
        b = loc.bounding_box
        bbox_str = f"- Measured Bounding Box: {{ x: {b.x}, y: {b.y}, width: {b.width}, height: {b.height} }}\n"

    measured_lines = "\n".join([f"  * {k}: {v}" for k, v in issue.evidence.measured_values.items()])
    expected_lines = "\n".join([f"  * {k}: {v}" for k, v in issue.evidence.expected_values.items()])
    constraints_lines = "\n".join([f"- {c}" for c in issue.constraints]) or "- Keep changes localized to this component."

    return f"""### AI FIX PROMPT: [{issue.check_id}] {issue.title}

#### 1. Problem Statement
{issue.problem}

#### 2. Empirical Evidence
- Selector: `{loc.selector}`
{bbox_str}- Measured Values:
{measured_lines}
- Target Standards:
{expected_lines}

#### 3. Component Location
- Selector: `{loc.selector}`
- Source Reference: {loc.source_file or "Search codebase for selector: " + loc.selector}

#### 4. Fix Instructions & Goal
{issue.fix_goal}

#### 5. Constraints
{constraints_lines}

#### 6. Acceptance Check
{issue.acceptance_check}
"""

def generate_master_prompt(issues: List[Issue], target_url: str) -> str:
    if not issues:
        return f"# MASTER REMEDIATION PLAN: {target_url}\n\nNo critical, major, or minor issues detected! Site achieved an A+ audit score."

    # Priority sorting: CRITICAL -> MAJOR -> MINOR -> SUGGESTION
    severity_order = {"CRITICAL": 0, "MAJOR": 1, "MINOR": 2, "SUGGESTION": 3}
    sorted_issues = sorted(issues, key=lambda i: severity_order.get(i.severity, 4))

    critical_issues = [i for i in sorted_issues if i.severity == "CRITICAL"]
    major_issues = [i for i in sorted_issues if i.severity == "MAJOR"]
    minor_issues = [i for i in sorted_issues if i.severity in ("MINOR", "SUGGESTION")]

    lines = [
        f"# MASTER ARCHITECTURAL REMEDIATION PLAN",
        f"Target: {target_url}",
        f"Total Issues: {len(issues)} (Critical: {len(critical_issues)}, Major: {len(major_issues)}, Minor: {len(minor_issues)})",
        "",
        "Execute these fixes sequentially in your AI coding assistant (Cursor / Claude Code / Antigravity):",
        ""
    ]

    if critical_issues:
        lines.append("## PASS 1: CRITICAL PRODUCTION & UX REPAIRS (Fix Immediately)")
        for idx, iss in enumerate(critical_issues, 1):
            lines.append(f"{idx}. [{iss.check_id}] {iss.title}")
            lines.append(f"   - Target Selector: `{iss.location.selector}`")
            lines.append(f"   - Goal: {iss.fix_goal}")
            lines.append(f"   - Acceptance: {iss.acceptance_check}")
            lines.append("")

    if major_issues:
        lines.append("## PASS 2: MAJOR RESPONSIVE, ACCESSIBILITY & STATE DEFECTS")
        for idx, iss in enumerate(major_issues, 1):
            lines.append(f"{idx}. [{iss.check_id}] {iss.title}")
            lines.append(f"   - Target Selector: `{iss.location.selector}`")
            lines.append(f"   - Goal: {iss.fix_goal}")
            lines.append(f"   - Acceptance: {iss.acceptance_check}")
            lines.append("")

    if minor_issues:
        lines.append("## PASS 3: POLISH, TYPOGRAPHY & DESIGN SYSTEM TOKEN REFINEMENT")
        for idx, iss in enumerate(minor_issues, 1):
            lines.append(f"{idx}. [{iss.check_id}] {iss.title}")
            lines.append(f"   - Target Selector: `{iss.location.selector}`")
            lines.append(f"   - Goal: {iss.fix_goal}")
            lines.append(f"   - Acceptance: {iss.acceptance_check}")
            lines.append("")

    return "\n".join(lines)
