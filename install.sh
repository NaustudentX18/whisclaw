#!/bin/bash
set -e

echo "WhisClaw Mission Control Installer"
echo "=================================="

# Install Go 1.21 if not present
install_go() {
    if command -v go &> /dev/null; then
        GO_VERSION=$(go version | grep -oP 'go\K[0-9]+\.[0-9]+')
        if [ "$(printf '%s\n' "1.21" "$GO_VERSION" | sort -V | head -n1)" = "1.21" ]; then
            echo "Go $GO_VERSION already installed"
            return
        fi
    fi

    echo "Installing Go 1.21..."
    GO_VERSION="1.21.13"
    ARCH=$(uname -m)

    if [ "$ARCH" = "x86_64" ]; then
        GO_ARCH="amd64"
    elif [ "$ARCH" = "aarch64" ]; then
        GO_ARCH="arm64"
    else
        echo "Unsupported architecture: $ARCH"
        exit 1
    fi

    wget -q "https://go.dev/dl/go${GO_VERSION}.linux-${GO_ARCH}.tar.gz" -O /tmp/go.tar.gz
    sudo rm -rf /usr/local/go
    sudo tar -C /usr/local -xzf /tmp/go.tar.gz
    rm /tmp/go.tar.gz

    export PATH="/usr/local/go/bin:$PATH"
    echo "Go $GO_VERSION installed"
}

install_go

# Set Go path
export PATH="/usr/local/go/bin:$PATH"

# Create WhisClaw directory structure
echo "Creating WhisClaw directories..."
mkdir -p ~/.whisclaw/{logs,cache,data,skills}
mkdir -p ~/whisclaw

# Clone or update WhisClaw repo
echo "Cloning/updating WhisClaw repo..."
if [ -d ~/whisclaw/.git ]; then
    echo "Updating existing WhisClaw repo..."
    cd ~/whisclaw
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null
else
    git clone https://github.com/NaustudentX18/whisclaw.git ~/whisclaw
    cd ~/whisclaw
fi

# Build whisclaw-web server
echo "Building whisclaw-web server..."
if [ -d ~/whisclaw/whisclaw-web ]; then
    cd ~/whisclaw/whisclaw-web
    go build -o /usr/local/bin/whisclaw-web .
    echo "whisclaw-web built successfully"
else
    echo "whisclaw-web directory not found, skipping build"
fi

# Create default config.json with dual-backend support
echo "Creating default config.json..."
mkdir -p ~/.whisclaw
cat > ~/.whisclaw/config.json << 'CONFIG'
{
    "backends": {
        "minimax": {
            "enabled": true,
            "api_key": "${MINIMAX_API_KEY}",
            "model": "MiniMax-M2"
        },
        "openai": {
            "enabled": true,
            "api_key": "${OPENAI_API_KEY}",
            "model": "gpt-4o-mini"
        }
    },
    "default_backend": "minimax",
    "server": {
        "host": "0.0.0.0",
        "port": 8080
    },
    "whisclaw": {
        "data_dir": "~/.whisclaw/data",
        "cache_dir": "~/.whisclaw/cache",
        "logs_dir": "~/.whisclaw/logs",
        "skills_dir": "~/.whisclaw/skills"
    }
}
CONFIG

# Create systemd service
echo "Creating systemd service..."
mkdir -p ~/.config/systemd/user

cat > ~/.config/systemd/user/whisclaw.service << 'SERVICE'
[Unit]
Description=WhisClaw Mission Control
After=network.target

[Service]
Type=simple
Environment=PATH=/usr/local/go/bin:/usr/local/bin:$PATH
Environment=HOME=/home/$USER
ExecStart=/usr/local/bin/whisclaw-web --config ~/.whisclaw/config.json
Restart=always
RestartSec=3
StandardOutput=append:%h/.whisclaw/logs/whisclaw.log
StandardError=append:%h/.whisclaw/logs/whisclaw.err.log

[Install]
WantedBy=default.target
SERVICE

# Reload systemd, enable and start service
echo "Enabling and starting whisclaw service..."
systemctl --user daemon-reload
systemctl --user enable --now whisclaw.service

# Show status
sleep 2
echo ""
echo "=================================="
echo "WhisClaw Mission Control installed!"
echo "=================================="
echo ""

# Get LAN IP
LAN_IP=$(hostname -I | awk '{print $1}')
echo "LAN access URL: http://$LAN_IP:8080"
echo ""
echo "Service status:"
systemctl --user status whisclaw.service --no-pager -l || true
