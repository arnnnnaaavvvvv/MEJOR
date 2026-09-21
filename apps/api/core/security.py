import ipaddress
import socket
import re
from urllib.parse import urlparse
from typing import Tuple, Optional
import time
from collections import defaultdict
from fastapi import HTTPException, Request

BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),       # Loopback
    ipaddress.ip_network("10.0.0.0/8"),        # RFC 1918 Private
    ipaddress.ip_network("172.16.0.0/12"),     # RFC 1918 Private
    ipaddress.ip_network("192.168.0.0/16"),    # RFC 1918 Private
    ipaddress.ip_network("169.254.0.0/16"),    # Link-local / Cloud Metadata (169.254.169.254)
    ipaddress.ip_network("0.0.0.0/8"),         # Broadcast / Current network
    ipaddress.ip_network("100.64.0.0/10"),     # Carrier-grade NAT
    ipaddress.ip_network("192.0.0.0/24"),      # IETF Protocol Assignments
    ipaddress.ip_network("198.18.0.0/15"),     # Benchmarking
    ipaddress.ip_network("224.0.0.0/4"),       # Multicast
    ipaddress.ip_network("240.0.0.0/4"),       # Reserved
    ipaddress.ip_network("255.255.255.255/32"),# Broadcast
    ipaddress.ip_network("::1/128"),           # IPv6 Loopback
    ipaddress.ip_network("fc00::/7"),          # IPv6 Unique Local
    ipaddress.ip_network("fe80::/10"),         # IPv6 Link-Local
    ipaddress.ip_network("::ffff:0:0/96"),     # IPv4-mapped IPv6
]

def normalize_ip_literal(host: str) -> Optional[str]:
    """
    Normalizes decimal integer, hex, octal, and dotted-quad IP notations to standard IPv4.
    Examples:
      '2130706433' -> '127.0.0.1'
      '0177.0.0.1' -> '127.0.0.1'
      '0x7f000001' -> '127.0.0.1'
    """
    clean_host = host.strip().lower()
    
    # Decimal integer notation (e.g. 2130706433)
    if clean_host.isdigit():
        try:
            return str(ipaddress.IPv4Address(int(clean_host)))
        except (ValueError, OverflowError):
            pass

    # Hexadecimal integer notation (e.g. 0x7f000001)
    if clean_host.startswith("0x"):
        try:
            return str(ipaddress.IPv4Address(int(clean_host, 16)))
        except (ValueError, OverflowError):
            pass

    # Dotted quad with potential octal/hex octets (e.g. 0177.0.0.1, 127.0.0.1)
    parts = clean_host.split(".")
    if len(parts) == 4:
        try:
            octets = []
            for p in parts:
                if p.startswith("0x"):
                    val = int(p, 16)
                elif p.startswith("0") and len(p) > 1 and p.isdigit():
                    val = int(p, 8)  # Octal representation
                else:
                    val = int(p, 10)
                if not (0 <= val <= 255):
                    return None
                octets.append(val)
            return str(ipaddress.IPv4Address(bytes(octets)))
        except (ValueError, OverflowError):
            pass

    return None

def is_ip_blocked(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        # Check if IPv4-mapped IPv6 address (e.g. ::ffff:127.0.0.1)
        if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
            ip = ip.ipv4_mapped
        return any(ip in net for net in BLOCKED_NETWORKS)
    except ValueError:
        return True

def validate_target_url(url: str) -> Tuple[bool, str]:
    """
    Strict SSRF validation:
    1. Scheme allow-list (http, https only)
    2. IP literal normalization (decimal, octal, hex)
    3. Block private, loopback, link-local, carrier-NAT, and cloud-metadata addresses
    4. DNS resolution validation
    """
    if not url or not isinstance(url, str) or not url.strip():
        return False, "URL cannot be empty."

    clean = url.strip()
    parsed = urlparse(clean)
    # If no protocol scheme was provided (e.g. neurosense-orcin.vercel.app or example.com), default to https://
    if not parsed.scheme:
        clean = "https://" + clean
        parsed = urlparse(clean)

    if parsed.scheme.lower() not in ("http", "https"):
        return False, f"Scheme '{parsed.scheme}' disallowed. Only HTTP and HTTPS are permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, "Invalid URL: hostname missing."

    # Check normalized IP literals (catches decimal, octal, hex representations)
    normalized_ip = normalize_ip_literal(hostname)
    if normalized_ip:
        if is_ip_blocked(normalized_ip):
            return False, f"Target IP {normalized_ip} is in a restricted or private subnet."

    # Direct standard IP address check (IPv4 / IPv6)
    try:
        ip = ipaddress.ip_address(hostname)
        if is_ip_blocked(str(ip)):
            return False, f"Target IP {hostname} is in a restricted or private subnet."
    except ValueError:
        pass

    # DNS Resolution Check
    try:
        addr_info = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
        resolved_ips = {item[4][0] for item in addr_info}
        if not resolved_ips:
            return False, f"Could not resolve DNS for hostname {hostname}."

        for ip_addr in resolved_ips:
            if is_ip_blocked(ip_addr):
                return False, f"Hostname {hostname} resolves to restricted IP {ip_addr}."
    except Exception as e:
        return False, f"DNS resolution failed for {hostname}: {str(e)}"

    canonical = parsed._replace(fragment="").geturl()
    return True, canonical

class RateLimiter:
    """Sliding-window memory rate limiter per client IP."""
    def __init__(self, requests_per_minute: int = 60):
        self.limit = requests_per_minute
        self.requests = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        window_start = now - 60.0
        timestamps = [t for t in self.requests[client_ip] if t > window_start]
        if len(timestamps) >= self.limit:
            return False
        timestamps.append(now)
        self.requests[client_ip] = timestamps
        return True

rate_limiter = RateLimiter()

def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait a minute before submitting more scans.")
