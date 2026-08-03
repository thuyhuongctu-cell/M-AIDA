#!/usr/bin/env python3
"""Fail-closed validation for the private M-AIDA web staging host."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlparse

REQUIRED = {
    "WEB_STAGING_DOMAIN",
    "WEB_STAGING_BASIC_AUTH_USER",
    "WEB_STAGING_BASIC_AUTH_HASH",
    "MAIDA_DATA_DIR",
    "MAIDA_BACKEND_ENV_FILE",
    "VITE_PRIVACY_POLICY_URL",
    "VITE_SUPPORT_URL",
}


def parse_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            raise ValueError(f"{path}:{number}: expected KEY=VALUE")
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if value[:1] == value[-1:] and value[:1] in {"'", '"'}:
            value = value[1:-1]
        values[key] = value
    return values


def require_https(name: str, value: str) -> None:
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password:
        raise ValueError(f"{name} must be a public HTTPS URL")
    if parsed.hostname and parsed.hostname.endswith((".invalid", ".example")):
        raise ValueError(f"{name} still uses a placeholder hostname")


def validate(env_path: Path) -> dict[str, str]:
    if not env_path.is_absolute():
        raise ValueError("--env-file must be an absolute host path")
    if not env_path.is_file():
        raise ValueError(f"staging env file not found: {env_path}")

    values = parse_env(env_path)
    missing = sorted(key for key in REQUIRED if not values.get(key))
    if missing:
        raise ValueError(f"missing required values: {', '.join(missing)}")

    domain = values["WEB_STAGING_DOMAIN"]
    if "://" in domain or "/" in domain or not re.fullmatch(
        r"(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}",
        domain,
    ):
        raise ValueError("WEB_STAGING_DOMAIN must be a bare DNS hostname")
    if domain.endswith((".invalid", ".example")):
        raise ValueError("WEB_STAGING_DOMAIN still uses a placeholder hostname")

    username = values["WEB_STAGING_BASIC_AUTH_USER"]
    if not re.fullmatch(r"[A-Za-z0-9._-]{3,64}", username):
        raise ValueError("WEB_STAGING_BASIC_AUTH_USER contains unsafe characters")

    password_hash = values["WEB_STAGING_BASIC_AUTH_HASH"]
    if not password_hash.startswith(("$2a$", "$2b$", "$2y$")):
        raise ValueError("WEB_STAGING_BASIC_AUTH_HASH must be a Caddy-compatible bcrypt hash")
    if "replace" in password_hash.lower():
        raise ValueError("WEB_STAGING_BASIC_AUTH_HASH is still a placeholder")

    data_dir = Path(values["MAIDA_DATA_DIR"])
    backend_env = Path(values["MAIDA_BACKEND_ENV_FILE"])
    if not data_dir.is_absolute():
        raise ValueError("MAIDA_DATA_DIR must be absolute")
    if not backend_env.is_absolute():
        raise ValueError("MAIDA_BACKEND_ENV_FILE must be absolute")
    if data_dir == Path("/") or backend_env == Path("/"):
        raise ValueError("host paths cannot be the filesystem root")
    if data_dir in backend_env.parents or backend_env in data_dir.parents:
        raise ValueError("database and secret paths must not contain one another")
    if not backend_env.is_file():
        raise ValueError(f"backend env file not found: {backend_env}")

    require_https("VITE_PRIVACY_POLICY_URL", values["VITE_PRIVACY_POLICY_URL"])
    require_https("VITE_SUPPORT_URL", values["VITE_SUPPORT_URL"])

    backend = parse_env(backend_env)
    if backend.get("MAIDA_DB_PATH") != "/data/maida.db":
        raise ValueError("backend MAIDA_DB_PATH must equal /data/maida.db")
    if backend.get("MAIDA_DEMO_MODE", "").lower() != "false":
        raise ValueError("backend MAIDA_DEMO_MODE must remain false")
    cors_raw = backend.get("CORS_ORIGINS", "")
    try:
        cors = json.loads(cors_raw)
    except json.JSONDecodeError as exc:
        raise ValueError("backend CORS_ORIGINS must be a JSON list") from exc
    expected_origin = f"https://{domain}"
    if cors != [expected_origin]:
        raise ValueError(f'backend CORS_ORIGINS must equal ["{expected_origin}"]')
    if backend.get("LLM_API_KEY", "").lower().startswith(("replace", "changeme")):
        raise ValueError("backend LLM_API_KEY is still a placeholder")

    return {
        "domain": domain,
        "data_dir": str(data_dir),
        "backend_env": str(backend_env),
        "privacy_url": values["VITE_PRIVACY_POLICY_URL"],
        "support_url": values["VITE_SUPPORT_URL"],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-file", type=Path, required=True)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()

    try:
        report = {"ok": True, **validate(args.env_file)}
    except (OSError, ValueError) as exc:
        report = {"ok": False, "error": str(exc)}
        if args.report:
            args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(f"BLOCKED: {exc}")
        return 1

    if args.report:
        args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
