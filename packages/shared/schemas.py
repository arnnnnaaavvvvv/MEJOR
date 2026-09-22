from __future__ import annotations
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
import uuid

LayerType = Literal['UX', 'UI', 'States', 'Production', 'Polish']
SeverityType = Literal['CRITICAL', 'MAJOR', 'MINOR', 'SUGGESTION']
ConfidenceType = Literal['HIGH', 'MEDIUM', 'LOW']
TierType = Literal['A', 'B', 'C', 'D', 'M']
ScanMode = Literal['quick', 'deep']
ScanStatus = Literal['QUEUED', 'VALIDATING', 'IN_PROGRESS', 'ANALYZING', 'COMPLETED', 'FAILED']

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class Location(BaseModel):
    selector: str
    text: Optional[str] = None
    bounding_box: Optional[BoundingBox] = None
    source_file: Optional[str] = None
    line: Optional[int] = None
    column: Optional[int] = None

class Evidence(BaseModel):
    measured_values: Dict[str, Any] = Field(default_factory=dict)
    expected_values: Dict[str, Any] = Field(default_factory=dict)
    viewport: Optional[int] = None
    screenshot_artifact_id: Optional[str] = None
    crop_artifact_id: Optional[str] = None
    notes: Optional[str] = None

class Issue(BaseModel):
    id: str = Field(default_factory=lambda: f"iss_{uuid.uuid4().hex[:8]}")
    check_id: str
    layer: LayerType
    severity: SeverityType
    confidence: ConfidenceType
    tier: TierType = 'A'
    title: str
    problem: str
    evidence: Evidence
    location: Location
    fix_goal: str
    constraints: List[str] = Field(default_factory=list)
    acceptance_check: str
    fix_prompt: Optional[str] = None
    patchable: Optional[bool] = None
    verified_patch_css: Optional[str] = None

class ManualCheckItem(BaseModel):
    id: str
    title: str
    layer: LayerType
    instructions: str
    verification_script: Optional[str] = None

class CoverageStats(BaseModel):
    total_checks_in_catalog: int = 200
    checks_executed: int = 0
    passed_count: int = 0
    failed_count: int = 0
    tier_breakdown: Dict[str, int] = Field(default_factory=dict)

class ScanRequest(BaseModel):
    url: str
    mode: ScanMode = 'quick'

class ScanResponse(BaseModel):
    id: str
    target_url: str
    normalized_domain: str
    mode: ScanMode
    status: ScanStatus
    progress_url: str
    created_at: datetime

class ScanProgressEvent(BaseModel):
    scan_id: str
    phase: str
    pct: int
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ArtifactMeta(BaseModel):
    id: str
    type: str # 'FULL_SCREENSHOT', 'CROP', 'VIDEO', 'DOM_SNAPSHOT'
    viewport: Optional[int] = None
    file_path: str
    url: str
    size_bytes: int

class ScanReport(BaseModel):
    scan_id: str
    target_url: str
    normalized_domain: str
    mode: ScanMode
    status: ScanStatus
    overall_score: float
    grade: str
    layer_scores: Dict[LayerType, float]
    coverage: CoverageStats
    issues: List[Issue]
    master_prompt: str
    manual_checklist: List[ManualCheckItem]
    artifacts: List[ArtifactMeta] = Field(default_factory=list)
    share_token: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

class DiffReport(BaseModel):
    base_scan_id: str
    compare_scan_id: str
    base_url: str
    score_delta: float
    grade_delta: str
    resolved_issues: List[Issue]
    persistent_issues: List[Issue]
    new_issues: List[Issue]

class PatchSet(BaseModel):
    css: str
    target_selectors: List[str] = Field(default_factory=list)
    patch_type: str = "animation-transform-rewrite"
    reversible: bool = True
    patchable: bool = True
    reason: Optional[str] = None

class PerformanceMetrics(BaseModel):
    avg_fps: float
    p95_frame_time_ms: float
    dropped_frames: int
    longtask_total_ms: float

class PatchResult(BaseModel):
    issue_id: str
    scan_id: str
    patchable: bool = True
    applied: bool = False
    reason_if_skipped: Optional[str] = None
    patch_css: str = ""
    target_selectors: List[str] = Field(default_factory=list)
    before_metrics: Optional[PerformanceMetrics] = None
    after_metrics: Optional[PerformanceMetrics] = None
    before_clip_url: Optional[str] = None
    after_clip_url: Optional[str] = None
    delta_fps: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

