import os
import yaml
from typing import Dict, Any, List, Optional, Type
from packages.shared.schemas import Issue, LayerType, SeverityType, ConfidenceType, TierType, Location, Evidence
from apps.worker.scanner_types import PageScanData, TelemetryMetrics

class CheckContext:
    def __init__(
        self,
        page_data: PageScanData,
        thresholds: Dict[str, Any],
        simulation_type: Optional[str] = None
    ):
        self.page_data = page_data
        self.thresholds = thresholds
        self.simulation_type = simulation_type
        # Primary desktop (1440) or mobile (390) capture
        self.primary_vp = page_data.viewport_data.get(1440) or (
            list(page_data.viewport_data.values())[0] if page_data.viewport_data else None
        )

class CheckPlugin:
    id: str
    name: str
    layer: LayerType
    default_severity: SeverityType
    confidence: ConfidenceType
    tier: TierType = "A"
    description: str

    def run(self, context: CheckContext) -> List[Issue]:
        raise NotImplementedError

class CheckRegistry:
    def __init__(self):
        self._plugins: Dict[str, CheckPlugin] = {}
        self.thresholds = self._load_thresholds()

    def _load_thresholds(self) -> Dict[str, Any]:
        config_path = os.path.join(
            os.path.dirname(__file__), "config", "thresholds.config.yaml"
        )
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        return {}

    def register(self, plugin_cls: Type[CheckPlugin]):
        instance = plugin_cls()
        self._plugins[instance.id] = instance
        return plugin_cls

    def get_all(self) -> List[CheckPlugin]:
        return list(self._plugins.values())

    def run_all(self, page_data: PageScanData, simulation_type: Optional[str] = None) -> List[Issue]:
        context = CheckContext(page_data, self.thresholds, simulation_type)
        all_issues: List[Issue] = []
        for plugin in self._plugins.values():
            try:
                issues = plugin.run(context)
                if issues:
                    all_issues.extend(issues)
            except Exception:
                pass
        return all_issues

registry = CheckRegistry()

def register_check(cls):
    return registry.register(cls)
