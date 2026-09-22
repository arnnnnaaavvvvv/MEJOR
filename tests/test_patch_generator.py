import pytest
from packages.shared.schemas import Issue, Evidence, Location
from packages.check_registry.patch_generator import generate_animation_patch, detect_js_animation_library
from packages.scoring_prompts.fix_prompts import generate_issue_prompt


def test_patch_generator_width_transition():
    issue = Issue(
        check_id="PERF-PROP-01",
        layer="Polish",
        severity="MAJOR",
        confidence="HIGH",
        title="Layout-inducing width transition detected",
        problem="Element animates width property causing continuous layout recalculation.",
        evidence=Evidence(
            measured_values={
                "animated_property": "width",
                "duration": "0.4s",
                "easing": "ease-in-out",
                "delay": "0.1s"
            }
        ),
        location=Location(selector=".animated-box"),
        fix_goal="Replace layout animation with composited transforms.",
        acceptance_check="Animates on composite thread."
    )

    patch = generate_animation_patch(issue)
    assert patch.patchable is True
    assert ".animated-box" in patch.css
    assert "transition: transform 0.4s ease-in-out 0.1s !important;" in patch.css
    assert "will-change: transform !important;" in patch.css
    assert "scaleX" in patch.css


def test_patch_generator_left_transition():
    issue = Issue(
        check_id="PERF-PROP-01",
        layer="Polish",
        severity="MAJOR",
        confidence="HIGH",
        title="Layout-inducing left transition",
        problem="Transitions left property.",
        evidence=Evidence(
            measured_values={
                "animated_property": "left",
                "duration": 300,
                "easing": "ease"
            }
        ),
        location=Location(selector="#hero-drawer"),
        fix_goal="Use transform translateX.",
        acceptance_check="Smooth 60fps."
    )

    patch = generate_animation_patch(issue)
    assert patch.patchable is True
    assert "#hero-drawer" in patch.css
    assert "translateX" in patch.css
    assert "left: 0 !important;" in patch.css
    assert "will-change: transform !important;" in patch.css


def test_patch_generator_refuses_gsap():
    issue = Issue(
        check_id="PERF-PROP-01",
        layer="Polish",
        severity="MAJOR",
        confidence="HIGH",
        title="GSAP animation stutter",
        problem="GSAP TweenMax tweening layout coordinates causing dropped frames.",
        evidence=Evidence(
            measured_values={"animated_property": "top"}
        ),
        location=Location(selector=".modal-content"),
        fix_goal="Optimize GSAP animation.",
        acceptance_check="No jank."
    )

    patch = generate_animation_patch(issue)
    assert patch.patchable is False
    assert patch.css == ""
    assert "js_library_detected" in patch.reason


def test_patch_generator_refuses_framer_motion():
    issue = Issue(
        check_id="PERF-PROP-01",
        layer="Polish",
        severity="MAJOR",
        confidence="HIGH",
        title="Framer motion jank",
        problem="Element animated via framer-motion layout prop.",
        evidence=Evidence(
            measured_values={"animated_property": "width"}
        ),
        location=Location(selector="motion.div"),
        fix_goal="Optimize framer motion.",
        acceptance_check="Smooth animation."
    )

    patch = generate_animation_patch(issue)
    assert patch.patchable is False
    assert "js_library_detected" in patch.reason


def test_patch_generator_refuses_padding():
    issue = Issue(
        check_id="PERF-PROP-01",
        layer="Polish",
        severity="MAJOR",
        confidence="HIGH",
        title="Padding animation",
        problem="Transitioning padding-left directly affects sibling layout flow.",
        evidence=Evidence(
            measured_values={"animated_property": "padding-left"}
        ),
        location=Location(selector=".collapsible-card"),
        fix_goal="Eliminate padding animation.",
        acceptance_check="No sibling reflow."
    )

    patch = generate_animation_patch(issue)
    assert patch.patchable is False
    assert "padding" in patch.reason


def test_fix_prompt_embeds_verified_css_patch():
    issue = Issue(
        check_id="PERF-PROP-01",
        layer="Polish",
        severity="MAJOR",
        confidence="HIGH",
        title="Width transition",
        problem="Transitions width.",
        evidence=Evidence(measured_values={"animated_property": "width"}),
        location=Location(selector=".box"),
        fix_goal="Refactor to transform.",
        acceptance_check="No reflow.",
        verified_patch_css=".box { will-change: transform !important; transform: scaleX(1) !important; }"
    )

    prompt = generate_issue_prompt(issue)
    assert "#### 4. Verified Working CSS Patch" in prompt
    assert ".box { will-change: transform !important; transform: scaleX(1) !important; }" in prompt
