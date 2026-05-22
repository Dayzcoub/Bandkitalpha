# BandKit — GitHub Actions Staging Deploy Checkpoint 1.10.25

## Status

GitHub Actions staging deploy workflow added.

This checkpoint introduces automatic deploy from GitHub `main` to the VPS staging preview.

---

## Environment

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- VPS preview: `http://141.98.87.9`
- App path on VPS: `/opt/Bandkitalpha`
- Backend service: `bandkit-backend`
- Backend local port: `127.0.0.1:3001`
- Public API prefix: `/api/`
- Database: local PostgreSQL `bandkit`

---

## Workflow added

File:

```text
.github/workflows/staging-deploy.yml
```

Triggers:

```text
push to main
manual workflow_dispatch
```

Concurrency:

```text
bandkit-staging-deploy
```

The workflow connects to VPS over SSH and runs:

```bash
cd /opt/Bandkitalpha
git fetch origin main
git checkout main
git pull --ff-only origin main
sudo -n bash scripts/staging-deploy.sh
bash scripts/staging-smoke-api.sh
git status --short
```

If the user is root, the workflow runs `bash scripts/staging-deploy.sh` without sudo.

---

## Required GitHub Secrets

Add these in GitHub:

```text
Settings → Secrets and variables → Actions → New repository secret
```

Required:

```text
STAGING_HOST=141.98.87.9
STAGING_USER=<ssh deploy user>
STAGING_SSH_KEY=<private SSH key for that user>
```

Optional:

```text
STAGING_PORT=22
STAGING_KNOWN_HOSTS=<ssh-keyscan known_hosts line>
```

If `STAGING_KNOWN_HOSTS` is absent, the workflow runs `ssh-keyscan` for the host.

---

## VPS one-time setup

Recommended deploy user:

```bash
sudo adduser bandkit-deploy
sudo usermod -aG sudo bandkit-deploy
sudo install -d -m 700 -o bandkit-deploy -g bandkit-deploy /home/bandkit-deploy/.ssh
sudo nano /home/bandkit-deploy/.ssh/authorized_keys
sudo chown bandkit-deploy:bandkit-deploy /home/bandkit-deploy/.ssh/authorized_keys
sudo chmod 600 /home/bandkit-deploy/.ssh/authorized_keys
```

Allow passwordless deploy command only:

```bash
sudo visudo -f /etc/sudoers.d/bandkit-deploy
```

Add:

```text
bandkit-deploy ALL=(root) NOPASSWD: /bin/bash /opt/Bandkitalpha/scripts/staging-deploy.sh
```

Validate:

```bash
sudo -u bandkit-deploy sudo -n bash /opt/Bandkitalpha/scripts/staging-deploy.sh
```

---

## Local key generation example

Generate a deploy key outside the repository:

```bash
ssh-keygen -t ed25519 -C "bandkit-staging-deploy" -f bandkit_staging_deploy
```

Public key goes to VPS:

```bash
cat bandkit_staging_deploy.pub
```

Private key content goes to GitHub secret:

```text
STAGING_SSH_KEY
```

Do not commit keys or `.env` files.

---

## Safety boundary

- Real secrets remain outside the repository.
- `/opt/Bandkitalpha/server/.env` stays only on the VPS.
- The workflow does not expose database passwords, tokens, or SSH keys.
- The workflow keeps using existing staging scripts.
- Schema changes still must go through migrations.
- This is staging/preview deploy, not production deploy.

---

## Verification

After secrets and VPS user are configured:

1. Open GitHub Actions.
2. Run `Deploy staging` manually.
3. Confirm final workflow output contains:

```text
[bandkit deploy] Staging deploy completed
[bandkit smoke] Smoke API test completed
[bandkit actions] Staging deploy and smoke completed
```

4. Open:

```text
http://141.98.87.9/bands/smoke-api-band
```

5. Confirm real DB detail panel is visible.

---

## Do not regress

- Do not store SSH private keys in repo files.
- Do not store `.env` values in GitHub-tracked files.
- Do not bypass `scripts/staging-deploy.sh` unless intentionally replacing deploy architecture.
- Do not connect frontend writes before auth/permissions.
- Keep manual staging deploy working as fallback.
