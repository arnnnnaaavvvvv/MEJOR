import os
import shutil
from typing import Tuple
from apps.api.core.config import settings

class ArtifactStorage:
    def __init__(self, base_dir: str = settings.ARTIFACTS_DIR):
        self.base_dir = os.path.abspath(base_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    def get_scan_dir(self, scan_id: str) -> str:
        scan_dir = os.path.join(self.base_dir, scan_id)
        os.makedirs(scan_dir, exist_ok=True)
        return scan_dir

    def save_bytes(self, scan_id: str, subpath: str, data: bytes) -> Tuple[str, str]:
        """Saves bytes and returns (absolute_file_path, public_relative_url)."""
        scan_dir = self.get_scan_dir(scan_id)
        dest_path = os.path.join(scan_dir, subpath)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        with open(dest_path, "wb") as f:
            f.write(data)
        
        # URL accessible via FastAPI static mount /artifacts
        url_path = f"/artifacts/{scan_id}/{subpath.replace(os.sep, '/')}"
        return dest_path, url_path

    def save_text(self, scan_id: str, subpath: str, text_content: str) -> Tuple[str, str]:
        return self.save_bytes(scan_id, subpath, text_content.encode("utf-8"))

storage = ArtifactStorage()
