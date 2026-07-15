# BandKit staging VPS deploy

This document describes the current GitHub Actions → VPS staging flow for BandKit.

## Current staging status

Current public staging URL:

```text
https://bandkitdev.mywire.org
```

Current deploy chain:

```text
GitHub main -> GitHub Actions -> SSH as bandkit-deploy -> sudo /usr/local/sbin/bandkit-staging-deploy -> scripts/staging-smoke-api.sh -> Nginx -> public HTTPS staging
```

The old IP-only preview is no longer the current public entry point. Direct IP access may still redirect to the domain for operator convenience, but the public staging URL is the domain above.

## Secrets expected by GitHub Actions

The workflow uses these repository secrets:

```text
STAGING_HOST=bandkitdev.mywire.org
STAGING_USER=bandkit-deploy
STAGING_PORT=22
STAGING_SSH_KEY=<private key content>
STAGING_KNOWN_HOSTS=<known_hosts content>
```

Do not commit private keys or known_hosts secrets into the repository.

## VPS-side deploy contract

The server-side deployment entry point is:

```text
/usr/local/sbin/bandkit-staging-deploy
```

Characteristics:

- file owner: `root:root`
- mode: `755`
- callable through sudo by `bandkit-deploy`
- supports `--check` for non-mutating validation
- performs Git, npm, build and migrations as `bandkit`
- uses root only for publication and service control steps that actually require elevated rights

## Manual operator checks

Wrapper preflight only:

```bash
sudo /usr/local/sbin/bandkit-staging-deploy --check
```

Manual deploy on VPS:

```bash
sudo /usr/local/sbin/bandkit-staging-deploy
```

Public health checks:

```bash
curl https://bandkitdev.mywire.org/api/v1/health
curl https://bandkitdev.mywire.org/api/v1/health/db
```

## SSH access for GitHub Actions

The dedicated SSH user is:

```text
bandkit-deploy
```

This user must not be reused for interactive admin work. It exists only to let GitHub Actions connect and run the controlled wrapper through sudo.

The GitHub Actions key should be stored outside the repository and injected via secrets. The public key must be present in:

```text
/home/bandkit-deploy/.ssh/authorized_keys
```

## Nginx staging site

The active site file is:

```text
/etc/nginx/sites-available/bandkit-preview
```

Current expectations:

- `https://bandkitdev.mywire.org` serves the frontend;
- `https://bandkitdev.mywire.org/api/` proxies to `127.0.0.1:3001/api/`;
- HTTP domain traffic redirects to HTTPS;
- direct HTTP access by IP may redirect to the domain.

## Workflow notes

The repository workflow that drives staging is:

```text
.github/workflows/staging-deploy.yml
```

The workflow should:

1. prepare the SSH key and known_hosts;
2. connect as `bandkit-deploy`;
3. run `sudo -n /usr/local/sbin/bandkit-staging-deploy`;
4. run the existing `scripts/staging-smoke-api.sh` smoke test;
5. fail if the VPS Git working tree is left dirty.

## Local development remains unchanged

Local commands remain:

```powershell
git pull origin main
npm run build
.\RESET_CACHE_AND_START.bat
```
