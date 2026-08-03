# M-AIDA private web staging runbook

Status: **internal/private pilot only**. This configuration does not authorize
publication, commercialization, store submission, CTU branding, or public
multi-user access.

## What this deploys

`docker-compose.web-staging.yml` runs three services on one Linux host:

1. `caddy` — public HTTPS entry point and HTTP Basic Authentication;
2. `frontend` — the React/Vite app served by nginx, including same-origin
   `/api/` proxying;
3. `backend` — FastAPI on a private Docker network with SQLite mounted from an
   absolute durable host directory.

Only Caddy publishes host ports. Neither the frontend nor the backend exposes a
host port directly.

## Host prerequisites

- a Linux VPS or container host with Docker Engine and Docker Compose;
- a DNS hostname pointing to the host;
- inbound TCP ports 80 and 443, plus UDP 443 when HTTP/3 is desired;
- a host directory such as `/srv/maida-staging/app`;
- a separate durable data directory such as `/srv/maida-staging/data`;
- secrets stored outside the Git checkout.

Do not use a shared public web host for this pilot. The current backend is a
single-researcher workflow and is not an authenticated multi-tenant service.

## 1. Prepare the host

```bash
sudo install -d -m 0750 /srv/maida-staging/{app,data,secrets}
sudo chown -R "$USER":"$USER" /srv/maida-staging

git clone https://github.com/thuyhuongctu/M-AIDA.git /srv/maida-staging/app
cd /srv/maida-staging/app
git checkout --detach <EXACT_APPROVED_SHA>
```

The exact SHA must belong to the approved UI integration branch. Do not deploy
an unreviewed moving branch name.

## 2. Create the backend environment

```bash
cp backend/.env.production.example /srv/maida-staging/secrets/backend.env
chmod 600 /srv/maida-staging/secrets/backend.env
```

Edit the file:

- set the exact LLM provider/model and secret only when live extraction is
  approved;
- keep `MAIDA_DB_PATH=/data/maida.db`;
- keep `MAIDA_DEMO_MODE=false`;
- set `CORS_ORIGINS` to a JSON list containing exactly the pilot HTTPS origin;
- leave Notion values blank until external synchronization is approved.

The pilot can start without an LLM key. Upload extraction will then return an
explicit unavailable response rather than silently fabricating results.

## 3. Create the web staging environment

```bash
cp .env.web-staging.example /srv/maida-staging/web-staging.env
chmod 600 /srv/maida-staging/web-staging.env

docker run --rm caddy:2-alpine \
  caddy hash-password --plaintext 'use-a-long-unique-password'
```

Paste the generated hash into `WEB_STAGING_BASIC_AUTH_HASH`. Because bcrypt
hashes contain dollar signs, keep the value single-quoted in the env file.

Replace every placeholder and confirm:

```dotenv
WEB_STAGING_DOMAIN=research-staging.your-domain.edu
WEB_STAGING_BASIC_AUTH_USER=researcher
WEB_STAGING_BASIC_AUTH_HASH='$2a$...'
MAIDA_DATA_DIR=/srv/maida-staging/data
MAIDA_BACKEND_ENV_FILE=/srv/maida-staging/secrets/backend.env
VITE_PRIVACY_POLICY_URL=https://...
VITE_SUPPORT_URL=https://...
```

## 4. Run fail-closed preflight

```bash
cd /srv/maida-staging/app

python3 scripts/validate_web_staging.py \
  --env-file /srv/maida-staging/web-staging.env \
  --report /tmp/maida-web-staging-preflight.json

docker compose \
  --env-file /srv/maida-staging/web-staging.env \
  -f docker-compose.web-staging.yml \
  config --quiet
```

Preflight blocks relative storage paths, placeholder hostnames, plaintext
passwords, demo mode, broad CORS, non-HTTPS legal/support URLs, and missing
backend secret files.

## 5. Start the private pilot

```bash
docker compose \
  --env-file /srv/maida-staging/web-staging.env \
  -f docker-compose.web-staging.yml \
  up -d --build
```

Caddy obtains and renews TLS certificates automatically after DNS and ports are
correct. The browser should request the pilot username and password before any
page or API endpoint is accessible.

## 6. Smoke test

```bash
curl --fail --user 'researcher:<PASSWORD>' \
  https://research-staging.your-domain.edu/healthz

curl --fail --user 'researcher:<PASSWORD>' \
  https://research-staging.your-domain.edu/api/health
```

The API response must report:

- `status: ok`;
- `storage: sqlite`;
- the expected application version;
- `demo_mode: false`;
- an extraction mode that accurately reflects whether an LLM key is present.

Then rehearse the full controlled flow with non-sensitive test material:

```text
PDF upload → extraction proposal → evidence review → PI override →
approve and lock → locked-only CSV export
```

Do not upload confidential or publisher-restricted PDFs until the host,
retention policy, access list, and backup procedure are approved.

## 7. GitHub protected workflow

`.github/workflows/web-staging.yml` is manual-only.

Validation-only run:

- `expected_sha`: exact 40-character SHA;
- `confirmation`: `VALIDATE-WEB-STAGING`;
- `deploy`: false.

Protected deployment additionally requires:

### GitHub Environment

Create an environment named `web-staging` and add required reviewers.

### Environment variables

| Variable | Example |
|---|---|
| `WEB_STAGING_APP_DIR` | `/srv/maida-staging/app` |
| `WEB_STAGING_ENV_FILE` | `/srv/maida-staging/web-staging.env` |
| `WEB_STAGING_BASE_URL` | `https://research-staging.your-domain.edu` |

### Environment secrets

| Secret | Purpose |
|---|---|
| `WEB_STAGING_SSH_HOST` | host address |
| `WEB_STAGING_SSH_USER` | restricted deployment account |
| `WEB_STAGING_SSH_PRIVATE_KEY` | deployment key |
| `WEB_STAGING_SSH_KNOWN_HOSTS` | pinned SSH host identity |
| `WEB_STAGING_BASIC_AUTH_USER` | smoke-test username |
| `WEB_STAGING_BASIC_AUTH_PASSWORD` | smoke-test plaintext password |

To deploy, use confirmation `DEPLOY-WEB-STAGING` and `deploy: true`. The
workflow checks out the exact SHA, validates the host configuration, builds the
containers, performs authenticated health checks, and uploads evidence. It
does not migrate data, publish a mobile app, create a release, or merge a PR.

## Backup and rollback

Before every deployment:

```bash
cp /srv/maida-staging/data/maida.db \
  "/srv/maida-staging/data/maida-$(date +%Y%m%d-%H%M%S).db"
```

Rollback code without replacing the data directory:

```bash
cd /srv/maida-staging/app
git checkout --detach <PREVIOUS_APPROVED_SHA>
docker compose \
  --env-file /srv/maida-staging/web-staging.env \
  -f docker-compose.web-staging.yml \
  up -d --build
```

Do not restore an older database over a newer one until schema compatibility
has been checked with the protected migration preflight.
