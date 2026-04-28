# WhisClaw 🦞

Lightweight PicoClaw-based pocket AI assistant for Raspberry Pi Zero 2 W with Whisplay HAT, PiSugar 3 battery, microphone, and speaker.

## What is WhisClaw?

WhisClaw turns a Raspberry Pi Zero 2 W + Whisplay HAT into a standalone pocket AI assistant. It uses [PicoClaw](https://github.com/sipeed/picoclaw) as the local agent runtime, which is designed for $10 hardware with <10MB RAM.

## Architecture

- **Pi Zero 2 W**: Everything runs locally except cloud model inference
- **PicoClaw**: Lightweight agent runtime (~30MB binary, <10MB RAM)
- **Whisplay**: Display, buttons, audio (existing hardware)
- **PiSugar 3**: Battery management
- **Cloud LLM**: MiniMax-M2.7 via API (you bring the key)

## Features

- Standalone operation (Wi-Fi + cloud API)
- Lobster-themed persona ("Claws open", "Clacking claws...")
- Wake word detection
- Voice recording + TTS
- Web display status
- Battery monitoring
- Low power design

## Quick Start

### Prerequisites

- Raspberry Pi OS Lite 64-bit (or existing Whisplay setup)
- Wi-Fi connection
- API key for LLM provider (MiniMax recommended)

### Install

```bash
# Clone the repo
git clone https://github.com/NaustudentX18/whisclaw.git
cd whisclaw

# Run install
chmod +x install.sh
./install.sh

# Configure
cp .env.example .env
# Edit .env with your API keys

# Start services
systemctl --user enable --now picoclaw
systemctl --user enable --now whisclaw
```

## Services

- `picoclaw.service` - PicoClaw gateway (port 18889)
- `whisclaw.service` - WhisClaw frontend

## Status Phrases

- Listening: "Claws open."
- Thinking: "Clacking claws..."
- Speaking: "Shelling it out."
- Error: "Snapped a claw. Check logs."
- Low battery: "Shell battery is low."

## Documentation

See [docs/](docs/) for detailed setup, troubleshooting, and development.

## License

MIT
