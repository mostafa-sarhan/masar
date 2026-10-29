# Purge `.env` from the backend git history (#1) — DONE (Oct 29)

> **Result:** backup `express-backup-20261029/` (old history, still contains `.env` — delete it once you're satisfied).
> `git filter-repo --force --invert-paths --path .env` (`--force`: not a fresh clone; backup taken first).
> Verified locally and on GitHub: 0 commits touch `.env`, no tree contains it, the old secret values appear nowhere.
> Pushed with `--force --all` / `--tags`: `main` d1613bc → 7b8a77f, `demo-upgrade` published (93614c2). No tags exist.
> Still to do by you: re-clone anywhere else the repo is checked out; if the repo is or was public, ask GitHub Support to purge cached commits (bef2bd6, fe76719, 99847ca).

Repo: `express/` → `https://github.com/mostafa-sarhan/backend.git`

Checked before writing this:
- The old `MONGO_URI` / `JWT_SECRET` values appear **only** in `.env` (38 commits, incl. bef2bd6, fe76719, 99847ca). No source file, `dist/` or `.env.example` contains them.
- `sys_shipping/` history only has a non-secret `VITE_API_URL` → no purge needed there.
- Rotating the DB password and JWT secret is the real fix; the rewrite only stops further exposure.

## 0. Before you start
- Rotate the MongoDB password and `JWT_SECRET` (you're doing this). Update `express/.env` locally.
- Make sure nobody else pushes to the repo while you do this.
- `demo-upgrade` exists only locally, so run the rewrite in this local repo (it has `main` + `demo-upgrade`).

## 1. Install and back up
```sh
brew install git-filter-repo
cd ~/Downloads/RouteAcadeny/shipping
cp -R express express-backup-$(date +%Y%m%d)   # full backup incl. .git
cd express
git status                                     # must be clean
git fetch origin                               # make sure origin/main is current
git branch -f main origin/main                 # local main = remote main
```

## 2. Rewrite history
```sh
git filter-repo --invert-paths --path .env
```
Optional, also shrinks the repo a lot (node_modules and dist were committed in old history; no secrets in them):
```sh
git filter-repo --invert-paths --path .env --path node_modules/ --path dist/
```
filter-repo removes the `origin` remote on purpose. All commit hashes change.

## 3. Verify (prints nothing if clean)
```sh
git log --all --oneline -- .env
git rev-list --all | xargs -I{} git ls-tree -r --name-only {} | grep -x ".env"
```

## 4. Push the rewritten history (every branch and tag)
```sh
git remote add origin https://github.com/mostafa-sarhan/backend.git
git push --force --all origin     # main, demo-upgrade and any other local branch
git push --force --tags origin    # every tag (none today, safe to run anyway)
git ls-remote origin              # check: remote refs now point at the new hashes
```
Remote branches that don't exist locally are **not** rewritten by `--all`. Today the remote only has `main`; if others appear, fetch them as local branches before step 2 (`git branch <name> origin/<name>`).

## 5. After pushing
- Anyone with a clone must re-clone (old clones still contain `.env`).
- GitHub can still serve old commits by SHA (and via forks / PR refs) until garbage collection. If the repo is or was public, ask GitHub Support to purge cached views, listing the old SHAs (bef2bd6, fe76719, 99847ca, …), and delete any forks you control.
- Delete the backup folder once you've confirmed everything: `rm -rf express-backup-YYYYMMDD`.
