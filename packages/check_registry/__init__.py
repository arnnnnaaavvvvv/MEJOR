from packages.check_registry.base import registry, CheckPlugin, CheckContext, register_check

# Import all checks to trigger @register_check decorator
import packages.check_registry.checks.design_system
import packages.check_registry.checks.ui_layout
import packages.check_registry.checks.responsive_mobile
import packages.check_registry.checks.forms_a11y
import packages.check_registry.checks.performance
import packages.check_registry.checks.motion
import packages.check_registry.checks.hygiene
import packages.check_registry.checks.simulation_states

__all__ = ["registry", "CheckPlugin", "CheckContext", "register_check"]
