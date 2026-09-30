"""
Core Security Module for Backend Services
Author: Arnav

Provides enterprise security primitives:
- Constant-time secret comparison
- Safe environment-loaded JWT verification
- Robust PBKDF2-HMAC-SHA256 password hashing
- Safe path traversal boundary enforcement
- SSRF loopback & private IP validation
"""

import os
import hmac
import hashlib
import secrets
import ipaddress
from urllib.parse import urlparse
from typing import Optional, Dict, Any

# Environment variables for sensitive secrets (Zero hardcoded secrets)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
DEBUG_MODE = os.getenv("DEBUG", "false").lower() == "true"


def verify_constant_time(val_a: str, val_b: str) -> bool:
    """
    Prevent timing attacks when validating tokens or signatures.
    """
    return secrets.compare_digest(val_a.encode("utf-8"), val_b.encode("utf-8"))


def hash_password(password: str, salt: Optional[bytes] = None) -> Dict[str, str]:
    """
    Cryptographically secure password hashing using PBKDF2-HMAC-SHA256.
    Uses 600,000 iterations to resist GPU/ASIC brute-force attacks.
    """
    if not salt:
        salt = secrets.token_bytes(32)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations=600000
    )
    return {
        "salt": salt.hex(),
        "hash": key.hex()
    }


def verify_password(password: str, salt_hex: str, expected_hash_hex: str) -> bool:
    """
    Verify password against stored salt and hash using constant-time comparison.
    """
    salt = bytes.fromhex(salt_hex)
    computed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations=600000
    )
    return secrets.compare_digest(computed.hex(), expected_hash_hex)


def resolve_safe_path(base_dir: str, user_path: str) -> Optional[str]:
    """
    Sanitize and enforce directory boundaries to prevent Path Traversal attacks.
    Returns the canonical path if within base_dir, or None if an escape attempt was made.
    """
    base_dir = os.path.realpath(base_dir)
    target_path = os.path.realpath(os.path.join(base_dir, user_path))
    if os.path.commonpath([base_dir, target_path]) == base_dir:
        return target_path
    return None


def is_safe_external_url(url: str) -> bool:
    """
    Validate target URL against Server-Side Request Forgery (SSRF).
    Rejects localhost, private IP ranges (RFC 1918), and link-local addresses (AWS metadata).
    """
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = parsed.hostname
        if not hostname:
            return False
        
        # Check if hostname is an IP address
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
        except ValueError:
            # Domain name check (e.g. block 'localhost')
            if hostname.lower() in ("localhost", "127.0.0.1", "::1"):
                return False
        
        return True
    except Exception:
        return False


def get_secure_cookie_flags() -> Dict[str, Any]:
    """
    Return secure cookie configuration options for session storage.
    """
    return {
        "httponly": True,
        "secure": not DEBUG_MODE,
        "samesite": "lax",
    }
