#!/usr/bin/env bash
# M-AIDA deploy preflight — run from the repo root on the deploy host.
# Fails loudly if anything required is missing. Changes nothing.
set -euo pipefail
red() { printf '\033[31m%s\033[0m\n' "$*"; }
grn() { printf '\033[32m%s\033[0m\n' "$*"; }

echo "== 1. backend/.env exists and carries the required secrets =="
[ -f backend/.env ] || { red "MISSING backend/.env (cp backend/.env.production.example backend/.env)"; exit 1; }
grep -q '^MAIDA_API_KEY=.\+' backend/.env || { red "MAIDA_API_KEY is empty -> protected routes will 503"; exit 1; }
grep -q '^LLM_API_KEY=.\+'   backend/.env || red "WARN: LLM_API_KEY empty -> /api/extract returns 503 (other features still work)"
grn "  .env OK"

echo "== 2. Caddyfile has a real domain + password hash =="
grep -q 'maida.example.com' deploy/Caddyfile && { red "deploy/Caddyfile still has the placeholder domain"; exit 1; } || true
grep -q 'REPLACE_WITH_HASH' deploy/Caddyfile && { red "deploy/Caddyfile still has the placeholder password hash"; exit 1; } || true
grn "  Caddyfile OK"

echo "== 3. backend test suite (needs MAIDA_API_KEY in env) =="
( cd backend && MAIDA_API_KEY=preflight python -m pytest tests -q )
grn "  tests OK"

echo "== 4. compose config is valid =="
docker compose -f docker-compose.prod.caddy.yml config >/dev/null
grn "  compose OK"

grn "PREFLIGHT PASSED — safe to run: docker compose -f docker-compose.prod.caddy.yml up -d --build"
