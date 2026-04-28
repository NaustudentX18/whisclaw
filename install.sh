#!/bin/bash
set -e

echo "🦞 WhisClaw Installer for Raspberry Pi Zero 2 W"

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "aarch64" ]; then
    PICOCLAW_URL="https://github.com/sipeed/picoclaw/releases/download/v0.2.7/picoclaw_Linux_arm64.tar.gz"
elif [ "$ARCH" = "armv7l" ]; then
    PICOCLAW_URL="https://github.com/sipeed/picoclaw/releases/download/v0.2.7/picoclaw_armv7.deb"
else
    echo "❌ Unsupported architecture: $ARCH"
    exit 1
fi

echo "📦 Installing PicoClaw..."
mkdir -p ~/picoclaw-install
cd ~/picoclaw-install
wget -q "$PICOCLAW_URL" -O picoclaw.tar.gz
tar -xzvf picoclaw.tar.gz

chmod +x picoclaw picoclaw-launcher picoclaw-launcher-tui
mkdir -p ~/.local/bin
cp picoclaw picoclaw-launcher picoclaw-launcher-tui ~/.local/bin/

export PATH="$HOME/.local/bin:$PATH"
echo "✅ PicoClaw installed: $(picoclaw version 2>&1 | grep Version)"

echo "📁 Creating WhisClaw directories..."
mkdir -p ~/whisclaw ~/whisclaw-logs ~/whisclaw/persona ~/whisclaw-bridge

echo "📄 Creating WhisClaw persona..."
cat > ~/whisclaw/persona/whisclaw.txt << 'PERSONA'
You are WhisClaw, a standalone pocket AI assistant running on a Raspberry Pi Zero 2 W with a Whisplay HAT screen, microphone, speaker, buttons, and a PiSugar 3 battery.

Style:
- helpful, direct, practical
- a little funny, lobster/claw-themed status phrases allowed
- keep answers short unless detail requested
- when giving commands, give exact commands
- when hardware/battery/Wi-Fi/storage relevant, mention clearly
- never pretend Pi Zero 2 W can run big local models well
- be honest about local limits

Status phrases:
- Listening: "Claws open."
- Thinking: "Clacking claws..."
- Speaking: "Shelling it out."
- Error: "Snapped a claw. Check logs."
- Low battery: "Shell battery is low."
PERSONA

echo "🔧 Creating WhisClaw bridge script..."
cat > ~/whisclaw-bridge/whisclaw-ask.sh << 'BRIDGE'
#!/bin/bash
export PATH="$HOME/.local/bin:$PATH"
MESSAGE="$1"
if [ -z "$MESSAGE" ]; then
  echo "Usage: whisclaw-ask.sh <message>"
  exit 1
fi
timeout 30 picoclaw agent -m "$MESSAGE" 2>&1 | grep -v "^🦞" | grep -v "^Hello" | head -5
BRIDGE
chmod +x ~/whisclaw-bridge/whisclaw-ask.sh

echo "🔧 Creating PicoClaw config..."
mkdir -p ~/.picoclaw/workspace

# Copy .env if exists
if [ -f ".env" ]; then
    cp .env ~/whisclaw/.env
fi

echo "🛠️ Creating systemd services..."
mkdir -p ~/.config/systemd/user

cat > ~/.config/systemd/user/picoclaw.service << 'SERVICE'
[Unit]
Description=PicoClaw Gateway
After=network.target

[Service]
Type=simple
Environment=PATH=/home/pi/.local/bin:$PATH
ExecStart=/home/pi/.local/bin/picoclaw gateway --host 127.0.0.1 --allow-empty
Restart=always
RestartSec=3
StandardOutput=append:/home/pi/whisclaw-logs/picoclaw.log
StandardError=append:/home/pi/whisclaw-logs/picoclaw.err.log

[Install]
WantedBy=default.target
SERVICE

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. cp .env.example .env"
echo "2. Edit .env with your API keys"
echo "3. systemctl --user daemon-reload"
echo "4. systemctl --user enable --now picoclaw"
echo "5. Test: curl http://127.0.0.1:18889/health"
