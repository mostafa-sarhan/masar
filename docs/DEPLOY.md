# Deploying Masar to a VPS

For a Hostinger VPS (Ubuntu) that already runs other Docker apps. Masar runs as its own compose
project (`masar`): its own containers (`masar-*`), network (`masar-net`) and volumes (`masar-*`).
Nothing here stops, prunes or rebinds anything that belongs to another app.

- App: `https://masar.mostafasarhan.tech`
- API: `https://api.masar.mostafasarhan.tech`

Both are on the same site (`mostafasarhan.tech`), so the auth cookies stay `SameSite=Strict`.

## What runs

| Container | What | Ports on the server |
|---|---|---|
| `masar-mongo-1` | MongoDB 7, single-node replica set, auth + keyfile | none |
| `masar-api-1` | API (Node 22, non-root, read-only filesystem) | `127.0.0.1:5080` |
| `masar-web-1` | Web app (nginx, non-root): clean URLs, gzip, CSP and security headers | `127.0.0.1:5081` |
| `masar-backup-1` | Daily `mongodump` to `./backups`, keeps 14 days | none |
| `masar-proxy-1` | *Optional* (`edge` profile): HTTPS for both domains, HTTP→HTTPS | `80`, `443` |
| `masar-certbot-1` | *Optional* (`edge` profile): renews the Let's Encrypt certificate | none |

## 1. Before you start

1. DNS: two **A records** pointing to the VPS IP: `masar.mostafasarhan.tech` and `api.masar.mostafasarhan.tech`.
   Check with `dig +short masar.mostafasarhan.tech`.
2. Docker with the compose plugin: `docker compose version` (v2.20+).
3. See what is already running and which ports are taken:
   ```sh
   docker ps --format 'table {{.Names}}\t{{.Ports}}'
   sudo ss -ltnp | grep -E ':(80|443|5080|5081)\b'
   ```
4. Decide how HTTPS is served:
   - **A. Ports 80 and 443 are free** → use Masar's own proxy (`COMPOSE_PROFILES=edge`). Steps 2–5.
   - **B. Another reverse proxy already owns 80/443** (nginx, Caddy, Traefik, Nginx Proxy Manager…) →
     leave `COMPOSE_PROFILES` empty and add two hosts to that proxy (step 6).
   If 5080/5081 are taken, pick other free ports for `API_PORT` / `WEB_PORT` in `.env.prod`.

## 2. Get the code

The repository is private: use a deploy key (read-only) or a fine-grained token.

```sh
sudo mkdir -p /opt/masar && sudo chown $USER /opt/masar
git clone https://github.com/mostafa-sarhan/masar.git /opt/masar
cd /opt/masar
```

## 3. Configure

```sh
./deploy/setup.sh          # creates .env.prod with random JWT / MongoDB secrets, and the MongoDB keyfile
nano .env.prod             # LETSENCRYPT_EMAIL, COMPOSE_PROFILES (edge or empty), ports, optional Sentry / demo
```

`.env.prod` and `deploy/secrets/` are git-ignored and readable by you only. Keep a copy of both in a
password manager: the database can't be opened without the MongoDB passwords.

## 4. Deploy

```sh
./deploy/deploy.sh
```

It checks that its ports are free (and refuses to start otherwise), builds both images, starts
MongoDB, takes a backup, runs the migrations, starts everything and waits for the health checks.
Re-run it for every update.

## 5. HTTPS with the bundled proxy (option A)

Once DNS points to the server:

```sh
./deploy/init-letsencrypt.sh
```

It gets one certificate for both domains; `masar-certbot-1` renews it automatically and the proxy reloads every 6 hours.

## 6. HTTPS with your existing proxy (option B)

Point the two domains at Masar's local ports. `TRUST_PROXY=1` (one proxy in front of the API).

**nginx on the host** (`/etc/nginx/sites-available/masar`, then `certbot --nginx -d masar.mostafasarhan.tech -d api.masar.mostafasarhan.tech`):

```nginx
server {
    server_name masar.mostafasarhan.tech;
    location / { proxy_pass http://127.0.0.1:5081; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; }
}
server {
    server_name api.masar.mostafasarhan.tech;
    client_max_body_size 3m;
    location / {
        proxy_pass http://127.0.0.1:5080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;   # overwrite, don't append
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Caddy**: `masar.mostafasarhan.tech { reverse_proxy 127.0.0.1:5081 }` and
`api.masar.mostafasarhan.tech { reverse_proxy 127.0.0.1:5080 }`.

**A proxy that runs in Docker** (Nginx Proxy Manager, Traefik…): `127.0.0.1` inside its container is not the
server. Connect it to Masar's network and use the container names:

```sh
docker network connect masar-net <proxy-container>
# upstreams: http://masar-web-1:8080 and http://masar-api-1:5000
```

## 7. First login

```sh
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api node dist/scripts/platform-admin.js you@example.com
```

It prints a one-time password. Sign in at `https://masar.mostafasarhan.tech/platform`, then create the first
company (or approve an access request). Check: `curl https://api.masar.mostafasarhan.tech/health` → `{"data":{"ok":true,...}}`.

## Updates and rollback

```sh
cd /opt/masar && git pull && ./deploy/deploy.sh
```

Every deploy backs up before migrating. To roll back: `git checkout <previous commit> && ./deploy/deploy.sh`,
and restore the pre-deploy backup if a migration changed data (below).

## Backups

- Daily at `BACKUP_HOUR` (UTC; 1 = 03:00 Cairo) into `BACKUP_DIR` (default `/opt/masar/backups`),
  files `masar-YYYYMMDD-HHMMSS.archive.gz`, older than `BACKUP_KEEP_DAYS` (14) deleted automatically.
- Take one now: `docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm --entrypoint /scripts/backup.sh backup once`
- **Copy them off the server** (a backup on the same disk doesn't survive a lost VPS), e.g. a nightly
  `rsync -a /opt/masar/backups/ user@other-host:masar-backups/` or Hostinger's snapshot feature.

### Restore (tested)

```sh
cd /opt/masar
ls backups/                                     # pick a file
docker compose -f docker-compose.prod.yml --env-file .env.prod stop api backup
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm --entrypoint /scripts/restore.sh backup /backups/masar-YYYYMMDD-HHMMSS.archive.gz
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --wait
```

Restoring replaces the collections in the backup with their backed-up content. Tested on Nov 6: 160 orders /
5 users → deleted → restored to 160 / 5; rotation removed files older than 14 days.

## Monitoring and logs

- Health: `/health` on the API (used by the Docker health checks; returns 503 while shutting down).
- Logs: `docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f api` (JSON, rotated at 10 MB × 5).
- Errors: set `SENTRY_DSN` (API) and `VITE_SENTRY_DSN` + `SENTRY_ORIGIN` (web, rebuilt by `deploy.sh`).
  Empty = off; the Sentry SDK isn't even loaded then.

## Demo mode

Set in `.env.prod`, then `./deploy/deploy.sh`:

```sh
DEMO_MODE=true
DEMO_WHATSAPP=201001234567          # number on the banner, digits only
```

- A separate company (`DEMO_TENANT_SLUG`, default `demo`) is created on start and reset every hour
  (`DEMO_RESET_MINUTES`). Visitors stay signed in across resets. Real companies are never touched.
- The login page shows one-click "Login as" buttons for every role and the banner
  "نسخة تجريبية — البيانات بتتمسح كل ساعة" with the WhatsApp button; the banner also shows inside the demo company.
- In the demo company, creating logins, changing passwords or roles, and creating API keys are disabled.
- The landing page's "Try the live demo" button opens `/login` automatically when demo mode is on.
  To send it to a different deployment instead, set `VITE_DEMO_URL` (needs a rebuild: `deploy.sh` does it).

## Security notes

- MongoDB is not published on any port; the API and backups use a user limited to the `masar` database.
- Firewall: only SSH, 80 and 443 need to be open (`sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp`).
  Ports 5080/5081 listen on 127.0.0.1 only.
- Containers run as non-root with `no-new-privileges`; the API and web have read-only filesystems.
- Rate limits are stored in MongoDB (`RATE_LIMIT_STORE=mongo`), so they survive restarts.
