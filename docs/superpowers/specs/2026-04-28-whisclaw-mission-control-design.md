# WhisClaw Mission Control — Design Specification

## Overview

WhisClaw Mission Control is a lightweight web dashboard for the Raspberry Pi Zero 2 W + Whisplay HAT pocket AI assistant. It provides browser-based control over the WhisClaw agent runtime, replacing PicoClaw branding throughout. The primary differentiator: first-to-market Whisplay HAT native mission control with a consumer-friendly UI.

## Hardware Stack

- **Device:** Raspberry Pi Zero 2 W (aarch64, 416MB RAM)
- **Display:** Whisplay HAT (LCD, buttons, WM8960 audio codec)
- **Battery:** PiSugar 3 (I2C battery management)
- **Runtime:** WhisClaw agent (PicoClaw derivative, ~10MB RAM)

## Branding

- **Name:** WhisClaw (not PicoClaw)
- **Mascot:** Captain Snips — 3D rendered lobster in a boat captain's hat
- **Assets:**
  - `captain-snips.png` — 200KB PNG, displayed in header, chat, loading states, favicon
  - Boot splash with mascot animation
- **CLI/Service:** `whisclaw` command replaces `picoclaw`
- **Gateway:** Port 18889 (unchanged for compatibility)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WhisClaw Mission Control                │
│                     (Port 8080, LAN)                       │
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│  Chat    │  Config  │  Skills  │  Files   │  Cron        │
│  Models  │   APIs   │ Calendar │ System   │  Teach Mode  │
├──────────┴──────────┴──────────┴──────────┴──────────────┤
│                    WhisClaw Gateway                        │
│                     (Port 18889)                           │
├───────────────────────────────────────────────────────────┤
│              WhisClaw Agent Runtime (~10MB)                │
├──────────────────┬──────────────────┬─────────────────────┤
│  Whisplay HAT   │   PiSugar 3       │   MiniMax / OpenAI  │
│  (Display/Audio)│   (Battery)       │   (LLM Backends)    │
└──────────────────┴──────────────────┴─────────────────────┘
```

## Frontend — WhisClaw Mission Control GUI

### Stack
- **Type:** Single-page application, no framework
- **Languages:** HTML5, CSS3, Vanilla JavaScript
- **Size:** ~80KB total (including mascot assets)
- **Theme:** Dark modern — frosted glass panels, subtle gradients, minimalist
- **Font:** Google Fonts — JetBrains Mono (monospace), Inter (UI)

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Captain Snips]  WhisClaw Mission Control    [─] [□] [×]  │
├────────┬────────────────────────────────────────────────────┤
│        │                                                    │
│  NAV   │              MAIN CONTENT AREA                     │
│        │                                                    │
│ [Chat] │   ┌────────────────────────────────────────┐     │
│ [Conf] │   │                                        │     │
│ [Skls] │   │         Panel-specific content          │     │
│ [File] │   │                                        │     │
│ [Cron] │   │                                        │     │
│ [Cal]  │   └────────────────────────────────────────┘     │
│ [APIs] │                                                    │
│ [Sys]  │                                                    │
│ [Tch]  │                                                    │
│        │                                                    │
├────────┴────────────────────────────────────────────────────┤
│ WhisClaw v0.2.7 │ Battery: 78% │ Uptime: 2h 34m │ LAN    │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Panels

| Panel | Description |
|-------|-------------|
| **Chat** | Direct messaging to WhisClaw gateway. Session history, clear, export. |
| **Config** | Edit `~/.whisclaw/config.json`. Model selection, API keys, system prompt, gateway port. |
| **Skills** | Browse clawhub marketplace. One-click install. Enable/disable/toggle skills. |
| **Files** | File browser for `~/.whisclaw/` and `/etc/whisclaw/`. Edit/view/create files. |
| **Cron** | Schedule WhisClaw commands. List/edit/delete scheduled tasks. |
| **Calendar** | Monthly calendar view. WhisClaw event reminders. Schedule from cron. |
| **APIs** | Token usage, rate limits, API health, cost tracking per model. |
| **System** | Battery %, uptime, CPU temp, memory (PiSugar via I2C), process list. |
| **Teach Mode** | Record custom command patterns. Train/test/activate voice shortcuts. |

### Visual States

| State | Display |
|-------|---------|
| **Boot** | Captain Snips splash with progress bar |
| **Loading** | Mascot avatar + typing indicator animation |
| **Idle** | Mascot avatar, status indicator (green dot) |
| **Error** | Red status dot, error toast notification |
| **Offline** | Gray status dot, "Gateway disconnected" banner |

## Backend — WhisClaw Runtime

### WhisClaw Gateway Service

- **Binary:** `whisclaw` (renamed from `picoclaw`)
- **Config:** `~/.whisclaw/config.json`
- **Logs:** `~/.whisclaw/logs/`
- **Skills:** `~/.whisclaw/skills/`
- **Port:** 18889 (unchanged)

### WhisClaw CLI Commands

```bash
whisclaw start        # Start gateway + web UI
whisclaw stop         # Stop services
whisclaw status       # Show running state
whisclaw chat "..."   # Direct CLI chat
whisclaw skills list  # List installed skills
whisclaw config edit  # Open config in $EDITOR
```

### Dual Backend Support

WhisClaw supports two LLM backends simultaneously:

| Backend | Configuration |
|---------|---------------|
| **MiniMax** | `config.json` — api_key, model (MiniMax-M2.7), api_base |
| **OpenAI** | `config.json` — openai_api_key, openai_model |

User selects active backend via Config panel or CLI flag.

## Mission Control Web Server

### Stack
- **Language:** Go (lightweight, compiles to single binary)
- **Static files:** Embedded HTML/CSS/JS + mascot assets
- **WebSocket:** Real-time chat with WhisClaw gateway
- **Auth:** Optional PIN protection (disabled by default for LAN access)

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Mission control SPA |
| GET | `/api/status` | WhisClaw gateway status |
| GET | `/api/config` | Current config (redacted) |
| POST | `/api/config` | Update config |
| GET | `/api/skills` | List installed skills |
| GET | `/api/cron` | List cron jobs |
| POST | `/api/cron` | Create cron job |
| DELETE | `/api/cron/:id` | Delete cron job |
| WS | `/ws` | WebSocket for chat + events |
| GET | `/api/system` | Battery, CPU, memory, temp |
| GET | `/api/calendar` | Calendar events |
| POST | `/api/calendar` | Create event |

## Data Storage

### Config (`~/.whisclaw/config.json`)

```json
{
  "model_backend": "minimax",
  "models": {
    "minimax": {
      "name": "MiniMax-M2.7",
      "api_key": "...",
      "api_base": "https://api.minimax.io/v1"
    },
    "openai": {
      "name": "gpt-4o-mini",
      "api_key": "..."
    }
  },
  "gateway": {
    "host": "127.0.0.1",
    "port": 18889
  },
  "mission_control": {
    "port": 8080,
    "pin_enabled": false,
    "pin": null
  },
  "system": {
    "device_name": "WhisClaw",
    "owner_name": null
  }
}
```

### Cron Jobs (`~/.whisclaw/cron.json`)

```json
{
  "jobs": [
    {
      "id": "uuid",
      "schedule": "0 9 * * *",
      "command": "remind 'Good morning!'",
      "enabled": true,
      "created_at": "2026-04-28T09:00:00Z"
    }
  ]
}
```

### Calendar Events (`~/.whisclaw/calendar.json`)

```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Meeting with WhisClaw",
      "datetime": "2026-04-28T14:00:00Z",
      "reminder": "15m",
      "enabled": true
    }
  ]
}
```

## Captain Snips — Mascot Specification

### Visual Design

- **Character:** Anthropomorphic lobster
- **Attire:** Boat captain's hat (navy blue, gold trim)
- **Expression:** Friendly, slightly goofy smile
- **Pose:** Standing, one claw raised in greeting
- **Style:** HD 3D rendered, cel-shaded aesthetic
- **Format:** PNG with transparent background
- **Size:** 512x512px base, scaled as needed

### Usage Locations

| Location | Size | Purpose |
|----------|------|---------|
| GUI header | 48x48px | Logo + brand |
| Chat avatar | 32x32px | WhisClaw response icon |
| Loading animation | 64x64px | Typing indicator |
| Boot splash | 256x256px | Startup screen |
| Favicon | 32x32px | Browser tab |
| Empty states | 128x128px | No-data illustrations |
| About page | 200x200px | Full mascot view |

## Install Flow

### Fresh Raspberry Pi OS Lite (64-bit)

```bash
# 1. Flash SD card with Raspberry Pi OS Lite 64-bit
# 2. Mount, enable SSH, add wifi creds

# 3. SSH in, run:
curl -fsSL https://raw.githubusercontent.com/NaustudentX18/whisclaw/main/install.sh | bash

# install.sh does:
# - Install Go 1.21 (if not present)
# - Clone/build WhisClaw repo
# - Create ~/.whisclaw/ directory structure
# - Download Captain Snips mascot assets
# - Generate default config
# - Create whisclaw.service (systemd)
# - Start WhisClaw gateway + mission control
# - Enable on boot
```

### Update Flow

```bash
whisclaw update   # Pull latest, restart service
```

## File Structure

```
~/.whisclaw/
├── config.json          # Main config
├── cron.json            # Scheduled jobs
├── calendar.json        # Calendar events
├── skills/              # Installed skills
│   └── skillname/
│       ├── skill.yaml
│       └── handler.ts
├── logs/                # Runtime logs
├── cache/               # Temp files
└── data/                # Persistent data

/usr/local/bin/
├── whisclaw             # Main binary
└── whisclaw-web        # Mission control server

/etc/whisclaw/
└── system.yaml          # System-wide config (optional)

~/whisclaw/
└── (symlink to ~/.whisclaw for compatibility)
```

## Dependencies

### Build-time
- Go 1.21+
- Node.js 18+ (for skill compilation)
- pnpm

### Runtime
- Raspberry Pi OS Lite 64-bit
- I2C enabled (for PiSugar battery)
- Network connectivity

### Go Dependencies
- `github.com/gorilla/websocket` — WebSocket
- `github.com/spf13/viper` — Config management
- `periph.io/x/periph` — I2C for PiSugar

## Security Considerations

- Gateway port 18889 bound to localhost only
- Mission control port 8080 bound to LAN interface
- Optional PIN protection for mission control
- API keys stored in config.json (user's homedir permissions)
- No cloud dependency — fully local operation

## Testing Strategy

- Unit tests for gateway API handlers
- Integration tests for WhisClaw bridge script
- E2E tests for mission control SPA (Playwright)
- Manual testing on actual Pi Zero 2 W hardware

## Out of Scope (v1)

- Mobile native app (web only)
- Cloud sync / remote access outside LAN
- Voice input via mission control (use Whisplay HAT mic)
- Multi-device coordination
- Skill marketplace payments
