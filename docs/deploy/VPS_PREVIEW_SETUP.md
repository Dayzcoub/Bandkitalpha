# BandKit VPS preview deployment

This document describes the GitHub → VPS preview flow for BandKit.

## Target scheme

```text
GitHub repo Dayzcoub/Bandkitalpha main
  -> GitHub Actions build
  -> rsync dist/ to VPS
  -> Nginx serves /var/www/bandkit/current
```

The workflow file is:

```text
.github/workflows/deploy-vps.yml
```

## GitHub Secrets

Add these secrets in GitHub repository settings:

```text
VPS_HOST=your.server.ip.or.domain
VPS_USER=bandkit
VPS_PORT=22
VPS_DEPLOY_PATH=/var/www/bandkit
VPS_SSH_KEY=private deploy key content
```

`VPS_PORT` and `VPS_DEPLOY_PATH` are optional. Defaults are `22` and `/var/www/bandkit`.

Do not commit private keys into the repository.

## Recommended VPS user

Create a dedicated deploy user:

```bash
sudo adduser --disabled-password --gecos "" bandkit
sudo mkdir -p /var/www/bandkit/releases
sudo chown -R bandkit:bandkit /var/www/bandkit
sudo chmod -R 755 /var/www/bandkit
```

Add the public key matching `VPS_SSH_KEY` to:

```text
/home/bandkit/.ssh/authorized_keys
```

## Nginx config example

Replace `demo.bandkit.example` with the real domain or use the VPS IP for first tests.

```nginx
server {
    listen 80;
    server_name demo.bandkit.example;

    root /var/www/bandkit/current;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        try_files $uri =404;
    }
}
```

Enable it:

```bash
sudo nano /etc/nginx/sites-available/bandkit-preview
sudo ln -s /etc/nginx/sites-available/bandkit-preview /etc/nginx/sites-enabled/bandkit-preview
sudo nginx -t
sudo systemctl reload nginx
```

## HTTPS later

After the domain points to the VPS:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d demo.bandkit.example
```

## Manual first deploy check

After the first successful GitHub Actions run:

```bash
ls -la /var/www/bandkit/current
curl -I http://demo.bandkit.example
```

For SPA deep links, this should also return the app instead of Nginx 404:

```bash
curl -I http://demo.bandkit.example/profile/p2
```

## Local development remains unchanged

Local commands remain:

```powershell
git pull origin main
npm run build
.\RESET_CACHE_AND_START.bat
```
