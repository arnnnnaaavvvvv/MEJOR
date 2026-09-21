import pytest
from packages.shared.schemas import Issue, Location, Evidence
from packages.scoring_prompts import calculate_scores, generate_issue_prompt, generate_master_prompt

def test_scoring_calculation():
    # 1 critical issue in UX (weight 0.25) -> -15 points on UX layer -> UX score = 85
    # All other layers 100
    issue = Issue(
        check_id="MOBI-TAP-01",
        layer="UX",
        severity="CRITICAL",
        confidence="HIGH",
        tier="A",
        title="Undersized Tap Target",
        problem="Button is 20x20px",
        evidence=Evidence(measured_values={"width": 20, "height": 20}, expected_values={"min_width": 44}),
        location=Location(selector="button.nav"),
        fix_goal="Increase padding to 44px",
        acceptance_check="Button is >= 44px"
    )

    overall, grade, layer_scores, coverage = calculate_scores([issue])
    assert layer_scores["UX"] == 85.0
    assert layer_scores["Production"] == 100.0
    assert overall < 100.0
    assert grade in ("A", "A+")
    assert coverage.failed_count == 1

def test_prompt_generation():
    issue = Issue(
        check_id="PROD-LEAK-01",
        layer="Production",
        severity="CRITICAL",
        confidence="HIGH",
        tier="A",
        title="Localhost URL Leaked",
        problem="Found http://localhost:3000 in markup",
        evidence=Evidence(measured_values={"url": "http://localhost:3000"}, expected_values={"clean": True}),
        location=Location(selector="a.test"),
        fix_goal="Use process.env.API_URL",
        acceptance_check="No localhost URLs"
    )

    prompt = generate_issue_prompt(issue)
    assert "### AI FIX PROMPT: [PROD-LEAK-01]" in prompt
    assert "Empirical Evidence" in prompt
    assert "Acceptance Check" in prompt

    master = generate_master_prompt([issue], "https://example.com")
    assert "PASS 1: CRITICAL PRODUCTION & UX REPAIRS" in master
    assert "[PROD-LEAK-01]" in master
