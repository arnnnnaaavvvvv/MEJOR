from typing import List, Dict, Tuple
from packages.shared.schemas import Issue, LayerType, SeverityType, ConfidenceType, CoverageStats

SEVERITY_DEDUCTIONS: Dict[SeverityType, float] = {
    "CRITICAL": 15.0,
    "MAJOR": 7.0,
    "MINOR": 2.0,
    "SUGGESTION": 0.0
}

CONFIDENCE_MULTIPLIERS: Dict[ConfidenceType, float] = {
    "HIGH": 1.0,
    "MEDIUM": 0.7,
    "LOW": 0.0  # Excluded from headline score if low-confidence / subjective
}

LAYER_WEIGHTS: Dict[LayerType, float] = {
    "Production": 0.30,
    "UX": 0.25,
    "UI": 0.20,
    "States": 0.15,
    "Polish": 0.10
}

def calculate_scores(issues: List[Issue], total_catalog_checks: int = 200) -> Tuple[float, str, Dict[LayerType, float], CoverageStats]:
    layer_deductions: Dict[LayerType, float] = {
        "Production": 0.0,
        "UX": 0.0,
        "UI": 0.0,
        "States": 0.0,
        "Polish": 0.0
    }

    tier_breakdown: Dict[str, int] = {"A": 0, "B": 0, "C": 0, "D": 0, "M": 0}

    for issue in issues:
        tier_breakdown[issue.tier] = tier_breakdown.get(issue.tier, 0) + 1
        deduction = SEVERITY_DEDUCTIONS.get(issue.severity, 0.0) * CONFIDENCE_MULTIPLIERS.get(issue.confidence, 1.0)
        layer = issue.layer if issue.layer in layer_deductions else "UI"
        layer_deductions[layer] += deduction

    # Layer scores clamped between 0 and 100
    layer_scores: Dict[LayerType, float] = {}
    for layer, deduction in layer_deductions.items():
        score = max(0.0, min(100.0, 100.0 - deduction))
        layer_scores[layer] = round(score, 1)

    # Weighted overall score
    overall = sum(layer_scores[l] * LAYER_WEIGHTS[l] for l in LAYER_WEIGHTS)
    overall = round(max(0.0, min(100.0, overall)), 1)

    # Grade determination
    if overall >= 95.0:
        grade = "A+"
    elif overall >= 85.0:
        grade = "A"
    elif overall >= 70.0:
        grade = "B"
    elif overall >= 50.0:
        grade = "C"
    else:
        grade = "F"

    coverage = CoverageStats(
        total_checks_in_catalog=total_catalog_checks,
        checks_executed=45 + tier_breakdown.get("B", 0),
        passed_count=max(0, (45 + tier_breakdown.get("B", 0)) - len(issues)),
        failed_count=len(issues),
        tier_breakdown=tier_breakdown
    )

    return overall, grade, layer_scores, coverage
