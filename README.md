# Qclaw — OpenClaw 管家控制台

A local ops dashboard that reads live data from the OpenClaw CLI/gateway, giving you real-time visibility and control over your OpenClaw deployment — all from a clean web UI.

---

## What It Is

Qclaw is a **local-only operations console** for OpenClaw. It talks to the OpenClaw CLI and gateway in real time, surfaces live status for your gateway, channels, sessions, and installed skills, and lets you take action (restart, repair, backup, rollback, stop tasks) without touching the terminal.

---

## Key Features

- **Live status panel** — gateway health, active channels, running sessions, installed skills
- **Supported channels** — QQ Bot + Feishu (WeChat and Telegram are not supported)
- **Action buttons** — restart gateway, repair broken installs, backup config, rollback to previous version, stop a running task
- **8-second auto-poll** — the UI refreshes every 8 s so you always see current state without manual refresh
- **Zero external dependencies** — everything runs locally; no cloud, no telemetry

---

## Architecture

```
Browser (Vite + React + TypeScript + Zustand)
        │  HTTP (localhost)
        ▼
server/index.mjs  ← Node.js BFF (Backend-for-Frontend)
        │  child_process / stdio
        ▼
openclaw CLI  ←→  OpenClaw Gateway
```

| Layer | Stack |
|---|---|
| Frontend | Vite · React · TypeScript · Zustand |
| BFF | Node.js (ESM) · `server/index.mjs` |
| Data source | `openclaw` CLI + gateway REST/stdio |

The BFF spawns `openclaw` subcommands to collect live data and proxies action requests (restart, backup, etc.) back to the CLI. In dev mode the BFF also serves Vite's HMR middleware so you only need one process.

---

## Requirements

- **Node.js 18+**
- **`openclaw` CLI** installed and available in `PATH`
- OpenClaw configured and (optionally) the gateway running

---

## Running

### Development

```bash
npm install
npm run dev
```

This starts `server/index.mjs --dev`, which spins up the Node.js BFF **and** Vite's dev middleware together. Open [http://localhost:5173](http://localhost:5173).

### Production

```bash
npm run build   # Vite builds static assets into dist/
npm start       # Starts server/index.mjs (serves dist/ as static files)
```

Open [http://localhost:3000](http://localhost:3000) (or the port printed in the terminal).

---

## Channels Shown

| Channel | Status |
|---|---|
| QQ Bot | ✅ Supported |
| Feishu | ✅ Supported |
| WeChat | ❌ Not supported |
| Telegram | ❌ Not supported |

---

## Known Limitations

- **`openclaw` must be in PATH** — the BFF calls the CLI via `child_process`; if it's missing or misconfigured, all live data will fail to load.
- **No authentication on the local server** — the BFF binds to `localhost` only and has no login/token mechanism. Do not expose the port externally.
- **Backups** are stored in `.qclaw/backups/` relative to your home directory. Disk space is not managed automatically.
- **Read-only for some fields** — session transcripts and detailed logs require the gateway to be running and reachable.

---

## Project Structure

```
qclaw/
├── src/               # React + TypeScript frontend
├── server/
│   └── index.mjs      # Node.js BFF
├── public/
├── vite.config.ts
├── package.json
└── README.md
```

---

## License

Internal tool — not published to npm.
