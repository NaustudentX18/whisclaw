# WhisClaw 🦞

> Pocket AI assistant powered by Raspberry Pi Zero 2 W, Whisplay HAT & PicoClaw

[![GitHub stars](https://img.shields.io/github/stars/NaustudentX18/whisclaw?style=flat-square&logo=github)](https://github.com/NaustudentX18/whisclaw/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://github.com/NaustudentX18/whisclaw/blob/main/LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Raspberry%20Pi%20Zero%202%20W-blue?style=flat-square&logo=raspberrypi)](https://github.com/NaustudentX18/whisclaw)
[![Architecture](https://img.shields.io/badge/Arch-aarch64%20%7C%20armv7l-green?style=flat-square)]()

**WhisClaw** transforms a Raspberry Pi Zero 2 W + Whisplay HAT into a standalone pocket AI companion.
It pairs a [PicoClaw](https://github.com/sipeed/picoclaw) local agent runtime with cloud LLM inference,
delivering voice I/O, a mobile web dashboard, battery monitoring, and a lobster persona.

---

## Hardware

| Component | Details |
|-----------|---------|
| **Pi Zero 2 W** | Quad-core ARM Cortex-A53, 512MB RAM |
| **Whisplay HAT** | 1.3" LCD, buttons, microphone, speaker (via GPIO) |
| **PiSugar 3** | Battery management + UPS (I2C) |
| **PicoClaw** | Lightweight agent runtime — ~30MB binary, <10MB RAM |

## Features

- 🎙️ **Voice I/O** — Wake word, speech-to-text, text-to-speech
- 📟 **Whisplay Dashboard** — Mobile-first web UI on port 8080
  - Chat, System monitor (CPU / memory / battery), Cron scheduler, Calendar, Config panels
- 🔋 **Battery monitoring** — PiSugar 3 via I2C
- 🌙 **Dark theme UI** — Frosted glass, bottom nav (mobile) / sidebar (desktop)
- 🦞 **Lobster persona** — "Claws open.", "Clacking claws...", "Shelling it out."
- 🔄 **Dual backend** — MiniMax-M2.7 and OpenAI-compatible APIs
- ⚡ **systemd services** — Auto-start on boot, crash recovery
- 🛠️ **CLI** — `whisclaw start / stop / status / chat / config / logs`

## Status Phrases

| State | Phrase |
|-------|--------|
| Listening | *"Claws open."* |
| Thinking | *"Clacking claws..."* |
| Speaking | *"Shelling it out."* |
| Error | *"Snapped a claw. Check logs."* |
| Low battery | *"Shell battery is low."* |

## Prerequisites

- Raspberry Pi Zero 2 W running Raspberry Pi OS Lite (64-bit recommended)
- Wi-Fi connectivity
- API key for your LLM provider — [MiniMax](https://api.minimax.io/) recommended
- SSH access to the Pi

## Quick Start

### One-line install

```bash
curl -fsSL https://raw.githubusercontent.com/NaustudentX18/whisclaw/main/install.sh | bash
```

### Manual install

```bash
# 1. Clone the repo onto your Pi
git clone https://github.com/NaustudentX18/whisclaw.git ~/whisclaw-src
cd ~/whisclaw-src

# 2. Run the installer
chmod +x install.sh
./install.sh

# 3. Configure your API key
cp .env.example ~/.whisclaw/.env
nano ~/.whisclaw/.env
# Set MINIMAX_API_KEY=your_key_here

# 4. Enable and start services
systemctl --user daemon-reload
systemctl --user enable --now picoclaw whisclaw
```

### Access the dashboard

Open on any device on the same network:

```
http://<pi-ip>:8080
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser / Phone                          │
│                 http://<pi-ip>:8080                        │
└─────────────────────────┬───────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────▼───────────────────────────────────┐
│                    whisclaw-web (Go)                        │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────┐  │
│   │  Chat  │  │ System │  │  Cron  │  │Calendar│  │Cfg │  │
│   └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘  └────┘  │
│        └───────────┼────────────┼────────────┘               │
│                    │  WebSocket relay                        │
└────────────────────┼────────────────────────────────────────┘
                     │ localhost:18889
┌────────────────────▼────────────────────────────────────────┐
│                    PicoClaw Gateway                          │
│            picoclaw agent runtime + bridge script             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS / API
┌────────────────────▼────────────────────────────────────────┐
│               Cloud LLM (MiniMax / OpenAI)                   │
└─────────────────────────────────────────────────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| `picoclaw` | 18889 | PicoClaw gateway + agent runtime |
| `whisclaw` | 8080 | Web dashboard + WebSocket relay |

### Service management

```bash
whisclaw start     # Start both services
whisclaw stop      # Stop both services
whisclaw status    # Check running state
whisclaw restart   # Restart both services
whisclaw logs      # Tail WhisClaw logs
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `WHISCLAW_BACKEND` | `picoclaw` | Agent backend |
| `MINIMAX_API_KEY` | — | Your MiniMax API key |
| `MINIMAX_LLM_MODEL` | `MiniMax-M2.7` | Model identifier |
| `MINIMAX_API_URL` | MiniMax endpoint | API base URL |
| `WHISPLAY_IM_BRIDGE_HOST` | `127.0.0.1` | Whisplay IM bridge host |
| `WHISPLAY_IM_BRIDGE_PORT` | `18888` | Whisplay IM bridge port |

## Project Structure

```
whisclaw/
├── install.sh                         # One-command Pi installer
├── whisclaw.service                  # systemd unit (WhisClaw web)
├── picoclaw.service                 # systemd unit (PicoClaw gateway)
├── .env.example                      # Configuration template
├── src/
│   └── cloud-api/
│       └── picoclaw/
│           └── picoclaw-llm.ts      # PicoClaw ↔ LLM bridge
└── whisclaw-web/                     # Go web server (on Pi after install)
    ├── main.go                       # Entry point, HTTP handlers
    ├── handlers.go                  # API: status, config
    ├── websocket.go                 # Browser ↔ gateway relay
    ├── cron.go                      # Cron job management
    ├── calendar.go                  # Calendar events
    ├── system.go                    # Battery, CPU, memory, uptime
    ├── config.go                    # Viper config
    └── static/                      # Mobile-first SPA
        ├── index.html
        ├── css/style.css            # Dark theme, frosted glass
        ├── js/                      # app, chat, config, cron, calendar, system
        └── assets/                  # Static assets
```

## Troubleshooting

**WhisClaw won't start**
```bash
journalctl --user -u whisclaw -f
```

**PicoClaw not responding**
```bash
curl http://127.0.0.1:18889/health
```

**Dashboard not loading**
```bash
systemctl --user status whisclaw
ss -tlnp | grep 8080
```

**Check logs**
```bash
tail -f ~/whisclaw-logs/whisclaw.log
tail -f ~/whisclaw-logs/picoclaw.log
```

## Hardware Wiring

```
Pi Zero 2 W  ────  Whisplay HAT  (GPIO)
       │
       └──────────  PiSugar 3     (I2C: GPIO 2/3 SDA/SCL)
```

Full pinout: [PicoClaw docs](https://github.com/sipeed/picoclaw)

## Contributing

Issues and PRs welcome. When adding features, test on real Pi Zero 2 W hardware —
emulators won't catch I2C/battery integration issues.

## License

MIT — see [LICENSE](LICENSE)

---

*🦞 Built with PicoClaw, Go, and a lot of caffeine.*
