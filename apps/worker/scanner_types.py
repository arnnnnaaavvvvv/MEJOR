from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class TelemetryMetrics(BaseModel):
    longtasks: List[Dict[str, Any]] = Field(default_factory=list)
    cumulative_layout_shift: float = 0.0
    raf_deltas: List[Dict[str, Any]] = Field(default_factory=list) # { delta_ms, scroll_y }
    layout_triggering_animations: List[Dict[str, Any]] = Field(default_factory=list)

class ViewportCaptureData(BaseModel):
    viewport: int
    screenshot_path: str
    screenshot_url: str
    dom_html: str
    computed_styles: Dict[str, Dict[str, str]] = Field(default_factory=dict) # selector -> style dict
    element_boxes: Dict[str, Dict[str, float]] = Field(default_factory=dict) # selector -> {x, y, w, h}

class PageScanData(BaseModel):
    url: str
    is_root: bool = False
    title: str = ""
    http_status: int = 200
    nav_links: List[str] = Field(default_factory=list)
    network_requests: List[Dict[str, Any]] = Field(default_factory=list)
    console_logs: List[Dict[str, Any]] = Field(default_factory=list)
    telemetry: TelemetryMetrics = Field(default_factory=TelemetryMetrics)
    viewport_data: Dict[int, ViewportCaptureData] = Field(default_factory=dict)
    video_path: Optional[str] = None
    video_url: Optional[str] = None
