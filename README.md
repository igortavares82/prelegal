# prelegal
A platform for drafting common legal agreements.

## Status

🚧 This project is in progress and expected to be completed in 1 week (by 2026-07-20).

## Running the app

The whole app (frontend + backend + a fresh SQLite database) runs in a single
Docker container.

```bash
# Mac
scripts/start-mac.sh
scripts/stop-mac.sh

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows (PowerShell)
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

Once started, the app is available at http://localhost:8000. There's no real
authentication yet — the login screen accepts any email/password.

See [`backend/README.md`](backend/README.md) and
[`frontend/README.md`](frontend/README.md) for local development (without
Docker) and testing instructions for each half of the app.
