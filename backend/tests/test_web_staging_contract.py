from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = ROOT / "scripts" / "validate_web_staging.py"

spec = importlib.util.spec_from_file_location("validate_web_staging", SCRIPT_PATH)
assert spec and spec.loader
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


def write_valid_environment(tmp_path: Path) -> Path:
    data_dir = tmp_path / "data"
    secret_dir = tmp_path / "secrets"
    data_dir.mkdir()
    secret_dir.mkdir()
    backend_env = secret_dir / "backend.env"
    backend_env.write_text(
        "\n".join(
            [
                "LLM_PROVIDER=anthropic",
                "LLM_API_KEY=",
                "LLM_MODEL=",
                "MAIDA_DB_PATH=/data/maida.db",
                "MAIDA_DEMO_MODE=false",
                'CORS_ORIGINS=["https://staging.maida.test"]',
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    staging_env = tmp_path / "web-staging.env"
    staging_env.write_text(
        "\n".join(
            [
                "WEB_STAGING_DOMAIN=staging.maida.test",
                "WEB_STAGING_BASIC_AUTH_USER=researcher",
                "WEB_STAGING_BASIC_AUTH_HASH='$2a$14$abcdefghijklmnopqrstuv1234567890123456789012345678901'",
                f"MAIDA_DATA_DIR={data_dir}",
                f"MAIDA_BACKEND_ENV_FILE={backend_env}",
                "VITE_PRIVACY_POLICY_URL=https://maida.test/privacy",
                "VITE_SUPPORT_URL=https://maida.test/support",
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    return staging_env


def test_private_web_staging_contract_is_fail_closed():
    compose = (ROOT / "docker-compose.web-staging.yml").read_text(encoding="utf-8")
    caddy = (ROOT / "Caddyfile.web-staging").read_text(encoding="utf-8")
    dockerfile = (ROOT / "frontend" / "Dockerfile").read_text(encoding="utf-8")
    workflow = (ROOT / ".github" / "workflows" / "web-staging.yml").read_text(
        encoding="utf-8"
    )

    assert "FROM node:22-slim" in dockerfile
    assert 'VITE_RELEASE_CHANNEL="internal"' in dockerfile
    assert 'VITE_RIGHTS_STATUS="pending-ctu-agreement"' in dockerfile
    assert "MAIDA_DEMO_MODE: \"false\"" in compose
    assert "${MAIDA_DATA_DIR:?Set an absolute MAIDA_DATA_DIR}:/data" in compose
    assert "basic_auth" in caddy
    assert "{$WEB_STAGING_BASIC_AUTH_HASH}" in caddy
    assert "reverse_proxy frontend:3000" in caddy
    assert "workflow_dispatch:" in workflow
    assert "default: false" in workflow
    assert "DEPLOY-WEB-STAGING" in workflow
    assert "environment: web-staging" in workflow


def test_validator_accepts_a_scoped_private_pilot(tmp_path: Path):
    report = validator.validate(write_valid_environment(tmp_path))
    assert report["domain"] == "staging.maida.test"
    assert Path(report["data_dir"]).is_absolute()


@pytest.mark.parametrize(
    ("key", "value", "expected"),
    [
        ("WEB_STAGING_DOMAIN", "http://staging.maida.test", "bare DNS hostname"),
        ("MAIDA_DATA_DIR", "relative/data", "must be absolute"),
        ("WEB_STAGING_BASIC_AUTH_HASH", "plaintext", "bcrypt hash"),
    ],
)
def test_validator_blocks_unsafe_host_values(
    tmp_path: Path, key: str, value: str, expected: str
):
    env_path = write_valid_environment(tmp_path)
    content = env_path.read_text(encoding="utf-8")
    lines = [
        f"{key}={value}" if line.startswith(f"{key}=") else line
        for line in content.splitlines()
    ]
    env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    with pytest.raises(ValueError, match=expected):
        validator.validate(env_path)


def test_validator_blocks_demo_mode_and_broad_cors(tmp_path: Path):
    env_path = write_valid_environment(tmp_path)
    values = validator.parse_env(env_path)
    backend_path = Path(values["MAIDA_BACKEND_ENV_FILE"])
    backend_path.write_text(
        "\n".join(
            [
                "MAIDA_DB_PATH=/data/maida.db",
                "MAIDA_DEMO_MODE=true",
                'CORS_ORIGINS=["*"]',
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match="MAIDA_DEMO_MODE"):
        validator.validate(env_path)
