import asyncio
import os
import sys
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from apps.api.core.database import init_db, async_session, ScanModel, IssueModel, PageModel
from packages.scoring_prompts import generate_master_prompt

async def seed_demo_data():
    await init_db()
    async with async_session() as db:
        base_id = "demo-base-scan-001"
        rescan_id = "demo-rescan-diff-002"

        # Check if already seeded
        existing = await db.get(ScanModel, base_id)
        if existing:
            print("Demo data already seeded.")
            return

        print("Seeding baseline scan...")
        scan1 = ScanModel(
            id=base_id,
            target_url="https://vibe-saas-example.dev",
            normalized_domain="vibe-saas-example.dev",
            mode="quick",
            status="COMPLETED",
            overall_score=68.5,
            grade="C",
            layer_scores={
                "Production": 70.0,
                "UX": 60.0,
                "UI": 65.0,
                "States": 85.0,
                "Polish": 75.0
            },
            coverage_stats={
                "total_checks_in_catalog": 200,
                "checks_executed": 45,
                "passed_count": 40,
                "failed_count": 5
            },
            share_token="demo-share-token-12345",
            completed_at=datetime.utcnow()
        )
        db.add(scan1)

        # Add initial issues
        issues_base = [
            IssueModel(
                id="iss_demo_01",
                scan_id=base_id,
                check_id="MOBI-TAP-01",
                layer="UX",
                severity="CRITICAL",
                confidence="HIGH",
                tier="A",
                title="Undersized Mobile Tap Target (<44x44px)",
                problem="CTA button has a touch bounding box of 24x24px, failing mobile touch target ergonomics.",
                evidence={"measured_values": {"width": 24, "height": 24}, "expected_values": {"min_width": 44, "min_height": 44}},
                location={"selector": "button.tiny-btn", "bounding_box": {"x": 20, "y": 140, "width": 24, "height": 24}},
                fix_goal="Expand button padding or minimum hit dimension to 44px x 44px.",
                constraints=["Preserve visual font size"],
                acceptance_check="Bounding box width and height must be >= 44px on viewports <= 768px.",
                fix_prompt="### AI FIX PROMPT: [MOBI-TAP-01]\nExpand button.tiny-btn padding to at least 44x44px."
            ),
            IssueModel(
                id="iss_demo_02",
                scan_id=base_id,
                check_id="PROD-LEAK-01",
                layer="Production",
                severity="CRITICAL",
                confidence="HIGH",
                tier="A",
                title="Localhost URL Leaked in Production DOM",
                problem="Found hardcoded 'http://localhost:8080' in header dev portal link.",
                evidence={"measured_values": {"leaked_url": "http://localhost:8080/dev"}, "expected_values": {"relative_url": True}},
                location={"selector": "header nav a[href*='localhost']"},
                fix_goal="Replace hardcoded localhost URL with process.env.NEXT_PUBLIC_PORTAL_URL.",
                constraints=["Keep anchor text intact"],
                acceptance_check="No localhost strings in production markup.",
                fix_prompt="### AI FIX PROMPT: [PROD-LEAK-01]\nReplace http://localhost:8080 with environment variable."
            ),
            IssueModel(
                id="iss_demo_03",
                scan_id=base_id,
                check_id="PROD-UNDEF-01",
                layer="Production",
                severity="CRITICAL",
                confidence="HIGH",
                tier="A",
                title="Literal 'undefined' Rendered to User",
                problem="User status node displays unhandled 'undefined' string.",
                evidence={"measured_values": {"rendered_literal": "undefined"}, "expected_values": {"fallback": True}},
                location={"selector": "div.user-info span"},
                fix_goal="Add nullish coalescing: user?.username ?? 'Guest'.",
                constraints=["Do not hide profile container"],
                acceptance_check="Text must not render 'undefined'.",
                fix_prompt="### AI FIX PROMPT: [PROD-UNDEF-01]\nGuard username interpolation with ?? 'Guest'."
            )
        ]
        for iss in issues_base:
            db.add(iss)

        print("Seeding rescan (diff)...")
        scan2 = ScanModel(
            id=rescan_id,
            parent_scan_id=base_id,
            target_url="https://vibe-saas-example.dev",
            normalized_domain="vibe-saas-example.dev",
            mode="quick",
            status="COMPLETED",
            overall_score=94.0,
            grade="A",
            layer_scores={
                "Production": 100.0,
                "UX": 92.0,
                "UI": 90.0,
                "States": 95.0,
                "Polish": 93.0
            },
            coverage_stats={
                "total_checks_in_catalog": 200,
                "checks_executed": 45,
                "passed_count": 44,
                "failed_count": 1
            },
            completed_at=datetime.utcnow()
        )
        db.add(scan2)

        # In rescan, all critical issues are resolved, only minor suggestion remains
        issue_rescan = IssueModel(
            id="iss_demo_04",
            scan_id=rescan_id,
            check_id="UI-LINE-01",
            layer="UX",
            severity="MINOR",
            confidence="HIGH",
            tier="A",
            title="Excessive Text Line Length (>75 Chars)",
            problem="Paragraph line length slightly wide at 82 chars.",
            evidence={"measured_values": {"chars_per_line": 82}, "expected_values": {"max_chars": 75}},
            location={"selector": "p.hero-text"},
            fix_goal="Add max-w-prose class.",
            constraints=[],
            acceptance_check="Line length <= 75ch."
        )
        db.add(issue_rescan)

        await db.commit()
        print(f"Demo data successfully seeded! Base Scan ID: {base_id}, Rescan ID: {rescan_id}")

if __name__ == "__main__":
    asyncio.run(seed_demo_data())
