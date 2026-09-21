from typing import List
from packages.shared.schemas import ManualCheckItem

STANDARD_MANUAL_CHECKLIST: List[ManualCheckItem] = [
    ManualCheckItem(
        id="MANU-001",
        title="Multi-Tab Session Synchronization",
        layer="States",
        instructions="Open the website in two concurrent browser tabs. In Tab 1, perform a logout. Switch to Tab 2 and perform a navigation action. Verify that Tab 2 automatically invalidates the session rather than displaying stale private state.",
        verification_script="""// Run in Browser Console
localStorage.clear();
sessionStorage.clear();
window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: null }));
console.log('Dispatched auth clearance across tabs. Verify UI redirected.');"""
    ),
    ManualCheckItem(
        id="MANU-002",
        title="Screen Reader Screen Orientation Voice Announcement",
        layer="UX",
        instructions="Enable VoiceOver (macOS/iOS) or NVDA (Windows). Rotate device from portrait to landscape and verify dynamic landmarks remain accessible without losing keyboard focus.",
        verification_script=None
    ),
    ManualCheckItem(
        id="MANU-003",
        title="Payment / External Gateway Timeout Resilience",
        layer="Production",
        instructions="Trigger checkout or external webhook call with browser network throttled to offline right before confirmation. Verify payment button does not double-charge or hang indefinitely without user error feedback.",
        verification_script=None
    )
]

def get_manual_checklist() -> List[ManualCheckItem]:
    return STANDARD_MANUAL_CHECKLIST
