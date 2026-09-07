"""Shared-secret gate for M-AIDA's sensitive routes.

A single key (``MAIDA_API_KEY``) protects the routes that create, alter, lock,
export, or externally sync study records. It fails closed: if the server has no
key configured, those routes return 503 rather than silently running open — so a
deployment that forgets to set the key is disabled, not exposed. The comparison
uses ``secrets.compare_digest`` to avoid a timing side channel.

This guards server-to-server and CLI callers. For the browser UI, prefer HTTP
Basic auth at the reverse proxy (see Caddyfile.example): a Vite bundle cannot
safely hold a secret, because everything shipped to the browser is readable.
"""
from __future__ import annotations

import secrets

from fastapi import Header, HTTPException

from settings import get_settings


def require_pi(x_maida_key: str = Header(default="", alias="X-MAIDA-Key")) -> None:
    """Allow the request only when it carries the correct ``X-MAIDA-Key``."""
    settings = get_settings()
    if not settings.maida_api_key:
        raise HTTPException(
            status_code=503,
            detail="MAIDA_API_KEY is not configured; protected routes are disabled.",
        )
    if not secrets.compare_digest(x_maida_key, settings.maida_api_key):
        raise HTTPException(status_code=401, detail="Invalid or missing X-MAIDA-Key.")
