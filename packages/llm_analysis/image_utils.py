import io
import base64
from typing import Optional, Tuple
from PIL import Image

def downscale_image_base64(
    image_bytes: bytes,
    max_dimension: int = 800,
    crop_box: Optional[Tuple[int, int, int, int]] = None
) -> str:
    """
    Downscales image or extracts bounding-box crop, returning compressed JPEG base64 string.
    Controls vision token budgets.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if crop_box:
            # (left, top, right, bottom)
            img = img.crop(crop_box)

        # Downscale proportionally if larger than max_dimension
        w, h = img.size
        if max(w, h) > max_dimension:
            scale = max_dimension / max(w, h)
            new_w, new_h = int(w * scale), int(h * scale)
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        # Convert to RGB (in case of RGBA PNG)
        if img.mode != "RGB":
            img = img.convert("RGB")

        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=80)
        return base64.b64encode(buffer.getvalue()).decode("utf-8")
    except Exception:
        return ""
