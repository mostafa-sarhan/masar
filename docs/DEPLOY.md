# Deploying Masar

Masar runs on the VPS (`ssh vps`) next to other apps, as two separate Docker compose projects:

| Instance | URL | Compose project | Port (127.0.0.1) | Settings |
|---|---|---|---|---|
| Production | https://masar.mostafasarhan.tech | `masar-prod` | 8090 | `/opt/masar/.env.prod` |
| Demo (`DEMO_MODE=true`) | https://demo.masar.mostafasarhan.tech | `masar-demo` | 8091 | `/opt/masar/.env.demo` |

Each instance has its own MongoDB (replica set + auth), network and volume, named after its project
(`masar-prod_*`, `masar-demo_*`). Nothing is shared with each other or with the other apps.

## How to update Masar later

On your Mac, in the repository, after committing:

```sh
deploy/update.sh
```

It ships the committed code (`git archive HEAD`: tracked files only, never `.env` files, `node_modules` or
local data) over `ssh vps` into `/opt/masar`, keeping the server's `.env.prod`, `.env.demo`,
`deploy/secrets/` and backups. Then, for each instance, it builds, backs up the database, runs the
migrations, restarts and checks `/api/health`. Other apps are not touched.
Only one instance: `deploy/update.sh prod` (or `demo`).

## How it fits together

```
browser ──HTTPS──▶ host nginx (TLS by certbot)          /etc/nginx/sites-available/<domain>
                        │  X-Forwarded-For = client address
                        ▼
                 127.0.0.1:8090 / 8091  ──▶  web container (nginx, non-root)
                                               ├── /        the app (clean URLs → index.html)
                                               └── /api/    → api container (Node 22, read-only fs)
                                                                 └── mongo container (not published)
```

- The app and its API share one origin (`/api`), so auth cookies are `Secure`, `HttpOnly`,
  `SameSite=Strict`, scoped to `/api` (`COOKIE_PATH_PREFIX=/api`); CORS allows only the site itself.
- `TRUST_PROXY=2`: the host nginx and the web container. The host nginx overwrites `X-Forwarded-For`,
  so clients can't fake their address past the rate limits.
- Memory caps per instance: mongo 512 MB (WiredTiger cache 0.25 GB), api 384 MB (Node heap 256 MB),
  web 64 MB, backup 256 MB.
- Images are built on the server (`masar-api`, `masar-web`, tagged with the git commit).

## Files on the server

| Path | What |
|---|---|
| `/opt/masar` | The code, shipped from the Mac by `deploy/update.sh` (no git on the server; `VERSION` holds the commit) |
| `/opt/masar/.env.prod`, `.env.demo` | Settings and secrets (chmod 600, git-ignored) |
| `/opt/masar/deploy/secrets/<instance>/mongo-keyfile` | MongoDB replica-set keyfile (chmod 600) |
| `/etc/nginx/sites-available/masar.mostafasarhan.tech`, `demo.masar.mostafasarhan.tech` | Host nginx sites (from `deploy/nginx/host/`), TLS added by certbot |
| `/etc/cron.d/masar-backup` | Daily backup of production at 01:00 UTC (03:00 Cairo) |
| `/var/backups/masar/prod` | Backups, `masar-YYYYMMDD-HHMMSS.archive.gz`, 14 days kept |
| `/var/log/masar-backup.log` | Backup log |

Keep a copy of both `.env` files and the keyfiles in your password manager: the databases can't be
opened without them.

## Common tasks

Run these in `/opt/masar`. `deploy/lib.sh` holds the compose command; the long form is
`docker compose -p masar-prod -f docker-compose.prod.yml --env-file .env.prod …`.

```sh
# Logs / status
docker compose -p masar-prod -f docker-compose.prod.yml --env-file .env.prod logs -f api
docker compose -p masar-prod -f docker-compose.prod.yml --env-file .env.prod ps

# Platform admin (create, or reset the password; prints a one-time password)
docker compose -p masar-prod -f docker-compose.prod.yml --env-file .env.prod exec api node dist/scripts/platform-admin.js you@example.com

# Backup now
deploy/backup-now.sh prod

# Reset the demo now (it also resets itself every hour)
docker compose -p masar-demo -f docker-compose.prod.yml --env-file .env.demo exec api node dist/scripts/demo-reset.js
```

Change a setting (for example `DEMO_WHATSAPP` in `.env.demo`): edit the file, then `deploy/deploy.sh demo`.

### Restore a backup

```sh
cd /opt/masar
ls /var/backups/masar/prod
C="docker compose -p masar-prod -f docker-compose.prod.yml --env-file .env.prod"
$C stop api
$C run --rm --entrypoint /scripts/restore.sh backup /backups/masar-YYYYMMDD-HHMMSS.archive.gz
$C up -d --wait
```

Restoring replaces the collections in the backup with their backed-up content (tested: backup → delete →
restore gave back every order and user; files older than 14 days are rotated out).
Copy backups off the server too (a backup on the same disk doesn't survive a lost VPS), e.g. a nightly
`rsync -a /var/backups/masar/ user@other-host:masar-backups/`.

### Rollback

On the Mac: `git checkout <previous commit> && deploy/update.sh prod && git checkout main`. If a migration
changed data, restore the backup that `deploy.sh` took just before migrating (above).

## Setting up from scratch (what was done on Nov 6)

```sh
# 0. Back up nginx
tar czf /root/nginx-backup-$(date +%F-%H%M).tgz /etc/nginx

# 1. The code (from the Mac, in the repository): ships HEAD into /opt/masar; the first run stops at
#    "Missing .env.prod" because the settings don't exist yet
deploy/update.sh

# 2. Settings with fresh secrets, then start both instances
cd /opt/masar
deploy/setup.sh prod && deploy/setup.sh demo
deploy/deploy.sh prod && deploy/deploy.sh demo

# 3. Host nginx: new files only, then TLS
cp deploy/nginx/host/masar.mostafasarhan.tech.conf /etc/nginx/sites-available/masar.mostafasarhan.tech
cp deploy/nginx/host/demo.masar.mostafasarhan.tech.conf /etc/nginx/sites-available/demo.masar.mostafasarhan.tech
ln -s /etc/nginx/sites-available/masar.mostafasarhan.tech /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/demo.masar.mostafasarhan.tech /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d masar.mostafasarhan.tech --redirect --non-interactive
certbot --nginx -d demo.masar.mostafasarhan.tech --redirect --non-interactive
nginx -t && systemctl reload nginx

# 4. Daily backups
cp deploy/cron/masar-backup /etc/cron.d/masar-backup

# 5. First platform admin (one-time password; change it at /platform)
docker compose -p masar-prod -f docker-compose.prod.yml --env-file .env.prod exec api node dist/scripts/platform-admin.js you@example.com
```

Certificates renew with the server's existing `certbot.timer`.

## Monitoring

- Health: `https://masar.mostafasarhan.tech/api/health` (Docker health checks use it; 503 while shutting down).
- Errors: set `SENTRY_DSN`, and `VITE_SENTRY_DSN` + `SENTRY_ORIGIN` in the instance's `.env`, then redeploy.
  Empty = off; the Sentry SDK isn't loaded at all then.
- Logs: JSON, rotated at 10 MB × 5 per container.

## Demo instance

`DEMO_MODE=true` in `.env.demo`: the demo company is seeded on start and reset every hour; visitors stay
signed in across resets. The login page shows "Login as" buttons for every role and the banner
"نسخة تجريبية — البيانات بتتمسح كل ساعة" (with a WhatsApp button when `DEMO_WHATSAPP` is set). In the demo
company, new logins, password and role changes, and API keys are disabled. Production's landing page links
"Try the live demo" to `https://demo.masar.mostafasarhan.tech/login` (`VITE_DEMO_URL` in `.env.prod`).

## Security notes

- MongoDB isn't published; the API and backups use a user limited to the `masar` database.
- Only the host nginx faces the internet (firewall: SSH, 80, 443). Masar listens on 127.0.0.1 only.
- Containers run as non-root with `no-new-privileges`; the API and web containers have read-only filesystems.
- Rate limits are stored in MongoDB, so they survive restarts.
