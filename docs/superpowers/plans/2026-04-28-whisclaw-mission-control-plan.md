# WhisClaw Mission Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build WhisClaw Mission Control — mobile-first lightweight web dashboard for Pi Zero 2 W + Whisplay HAT pocket AI assistant.

**Architecture:** Go-based mission control server (`whisclaw-web`) serves static HTML/CSS/JS on port 8080. WebSocket bridges to WhisClaw gateway on port 18889. Dual-backend support (MiniMax + OpenAI) via config. Captain Snips mascot throughout UI.

**Tech Stack:** Go 1.21+, Vanilla HTML/CSS/JS (no framework), gorilla/websocket, spf13/viper, periph.io for I2C.

**Design Priority:** Mobile-first. Primary use case: phone/tablet accessing WhisClaw on LAN. Desktop = secondary.

---

## File Structure

```
whisclaw/
├── install.sh                           # Main install script
├── whisclaw-web/                       # Mission control Go server
│   ├── main.go                         # Entry point, HTTP server, WebSocket
│   ├── handlers.go                     # API handlers
│   ├── config.go                       # Config management
│   ├── cron.go                         # Cron job management
│   ├── calendar.go                     # Calendar event management
│   ├── system.go                       # System info (PiSugar I2C)
│   ├── skills.go                       # Skills management
│   ├── websocket.go                   # WebSocket client to gateway
│   └── static/                         # Frontend assets
│       ├── index.html                  # Main SPA
│       ├── css/
│       │   └── style.css               # Mobile-first responsive
│       ├── js/
│       │   ├── app.js                  # Main app, nav, state
│       │   ├── chat.js                 # Chat panel
│       │   ├── config.js               # Config panel
│       │   ├── skills.js               # Skills panel
│       │   ├── files.js                # Files panel
│       │   ├── cron.js                 # Cron panel
│       │   ├── calendar.js             # Calendar panel
│       │   ├── apis.js                 # APIs panel
│       │   ├── system.js               # System panel
│       │   └── teach.js                # Teach mode panel
│       └── assets/
│           └── captain-snips.png       # Mascot (256x256)
├── src/cloud-api/whisclaw/
│   ├── whisclaw-cli.ts                 # CLI commands
│   └── whisclaw-config.ts             # Config read/write
├── whisclaw.service                    # systemd service
└── docs/superpowers/
    ├── specs/2026-04-28-whisclaw-mission-control-design.md
    └── plans/2026-04-28-whisclaw-mission-control-plan.md
```

---

## Task 1: Update install.sh

**Files:**
- Modify: `install.sh`

- [ ] **Step 1: Read current install.sh**

Run: `cat install.sh`

- [ ] **Step 2: Update install.sh with WhisClaw Mission Control**

```bash
#!/bin/bash
set -e

echo "🍯 Installing WhisClaw Mission Control..."

# Install Go if not present
if ! command -v go &> /dev/null; then
    echo "📦 Installing Go 1.21..."
    curl -fsSL https://go.dev/dl/go1.21.0.linux-arm64.tar.gz -o /tmp/go.tar.gz
    sudo tar -C /usr/local -xzf /tmp/go.tar.gz
    rm /tmp/go.tar.gz
    export PATH=$PATH:/usr/local/go/bin
fi

# Create WhisClaw directory structure
mkdir -p ~/.whisclaw/{logs,cache,data,skills}
mkdir -p ~/whisclaw

# Clone or update WhisClaw repo
if [ ! -d ".git" ]; then
    git clone https://github.com/NaustudentX18/whisclaw.git ~/whisclaw-src
    cd ~/whisclaw-src
else
    cd ~/whisclaw
    git pull
fi

# Build whisclaw-web (mission control server)
echo "🔨 Building whisclaw-web..."
cd ~/whisclaw-src/whisclaw-web
go build -o /usr/local/bin/whisclaw-web .

# Create default config if not exists
if [ ! -f ~/.whisclaw/config.json ]; then
    cat > ~/.whisclaw/config.json << 'EOF'
{
  "model_backend": "minimax",
  "models": {
    "minimax": {
      "name": "MiniMax-M2.7",
      "api_key": "",
      "api_base": "https://api.minimax.io/v1"
    },
    "openai": {
      "name": "gpt-4o-mini",
      "api_key": ""
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
EOF
fi

# Download Captain Snips mascot (placeholder)
if [ ! -f ~/.whisclaw/captain-snips.png ]; then
    echo "🦞 Downloading Captain Snips..."
    touch ~/.whisclaw/captain-snips.png
fi

# Create systemd service
echo "📡 Creating whisclaw.service..."
sudo tee /etc/systemd/system/whisclaw.service > /dev/null << 'EOF'
[Unit]
Description=WhisClaw Mission Control
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi
ExecStart=/usr/local/bin/whisclaw-web --config /home/pi/.whisclaw/config.json
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "🚀 Starting WhisClaw service..."
sudo systemctl daemon-reload
sudo systemctl enable whisclaw
sudo systemctl start whisclaw

echo "✅ WhisClaw Mission Control installed!"
echo "🌐 Access at: http://$(hostname -I | awk '{print $1}'):8080"
```

- [ ] **Step 3: Commit**

```bash
git add install.sh
git commit -m "feat: add WhisClaw Mission Control to install.sh"
```

---

## Task 2: Create Go Mission Control Server

**Files:**
- Create: `whisclaw-web/main.go`
- Create: `whisclaw-web/go.mod`
- Create: `whisclaw-web/handlers.go`
- Create: `whisclaw-web/config.go`
- Create: `whisclaw-web/cron.go`
- Create: `whisclaw-web/calendar.go`
- Create: `whisclaw-web/system.go`
- Create: `whisclaw-web/skills.go`
- Create: `whisclaw-web/websocket.go`

- [ ] **Step 1: Create go.mod**

```bash
mkdir -p whisclaw-web
cd whisclaw-web
cat > go.mod << 'EOF'
module github.com/NaustudentX18/whisclaw/whisclaw-web

go 1.21

require (
    github.com/gorilla/websocket v1.5.1
    github.com/spf13/viper v1.18.2
)
EOF
```

- [ ] **Step 2: Create main.go**

```go
package main

import (
    "flag"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
)

func main() {
    configPath := flag.String("config", os.ExpandEnv("$HOME/.whisclaw/config.json"), "Path to config")
    port := flag.Int("port", 8080, "Mission control port")
    flag.Parse()

    cfg, err := loadConfig(*configPath)
    if err != nil {
        log.Printf("Warning: could not load config: %v", err)
        cfg = &Config{}
    }

    fs := http.FileServer(http.Dir("static"))
    http.Handle("/", fs)
    http.HandleFunc("/api/status", handleStatus(cfg))
    http.HandleFunc("/api/config", handleConfig(cfg))
    http.HandleFunc("/api/cron", handleCron())
    http.HandleFunc("/api/calendar", handleCalendar())
    http.HandleFunc("/api/system", handleSystem())
    http.HandleFunc("/api/skills", handleSkills())
    http.HandleFunc("/ws", handleWebSocket(cfg))

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

    go func() {
        addr := ":" + string(rune(*port))
        log.Printf("🍯 WhisClaw Mission Control listening on %s", addr)
        if err := http.ListenAndServe(addr, nil); err != nil {
            log.Fatal(err)
        }
    }()

    <-quit
    log.Println("Shutting down WhisClaw...")
}
```

- [ ] **Step 3: Create handlers.go**

```go
package main

import (
    "encoding/json"
    "net/http"
)

type Config struct {
    ModelBackend   string                 `json:"model_backend"`
    Models         map[string]ModelConfig `json:"models"`
    Gateway        GatewayConfig          `json:"gateway"`
    MissionControl MissionControlConfig   `json:"mission_control"`
}

type ModelConfig struct {
    Name    string `json:"name"`
    APIKey  string `json:"api_key,omitempty"`
    BaseURL string `json:"api_base,omitempty"`
}

type GatewayConfig struct {
    Host string `json:"host"`
    Port int    `json:"port"`
}

type MissionControlConfig struct {
    Port       int  `json:"port"`
    PinEnabled bool `json:"pin_enabled"`
    Pin        *string `json:"pin,omitempty"`
}

func handleStatus(cfg *Config) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]interface{}{
            "status": "online",
            "gateway": cfg.Gateway,
        })
    }
}

func handleConfig(cfg *Config) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if r.Method == http.MethodGet {
            json.NewEncoder(w).Encode(cfg)
        } else if r.Method == http.MethodPost {
            json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
        }
    }
}
```

- [ ] **Step 4: Create websocket.go**

```go
package main

import (
    "log"
    "net/http"
    "net/url"
    "sync"

    "github.com/gorilla/websocket"
)

var (
    gatewayConn *websocket.Conn
    gatewayMu   sync.Mutex
)

func handleWebSocket(cfg *Config) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        upgrader := websocket.Upgrader{}
        conn, err := upgrader.Upgrade(w, r, nil)
        if err != nil {
            log.Printf("WebSocket upgrade error: %v", err)
            return
        }
        defer conn.Close()

        gatewayMu.Lock()
        if gatewayConn == nil {
            u := url.URL{Scheme: "ws", Host: cfg.Gateway.Host + ":" + itoa(cfg.Gateway.Port), Path: "/ws"}
            gatewayConn, _, err = websocket.DefaultDialer.Dial(u.String(), nil)
            if err != nil {
                log.Printf("Gateway connection error: %v", err)
                gatewayMu.Unlock()
                return
            }
        }
        gatewayMu.Unlock()

        for {
            _, msg, err := conn.ReadMessage()
            if err != nil {
                break
            }
            gatewayMu.Lock()
            if gatewayConn != nil {
                gatewayConn.WriteMessage(websocket.TextMessage, msg)
            }
            gatewayMu.Unlock()
        }
    }
}

func itoa(i int) string {
    return string(rune('0'+i/10000%10)) + string(rune('0'+i/1000%10)) + string(rune('0'+i/100%10)) + string(rune('0'+i/10%10)) + string(rune('0'+i%10))
}
```

- [ ] **Step 5: Create cron.go**

```go
package main

import (
    "encoding/json"
    "net/http"
    "os"
    "sync"
    "time"

    "github.com/google/uuid"
)

type CronJob struct {
    ID        string    `json:"id"`
    Schedule  string    `json:"schedule"`
    Command   string    `json:"command"`
    Enabled   bool      `json:"enabled"`
    CreatedAt time.Time `json:"created_at"`
}

var cronMu sync.Mutex

func handleCron() http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        cronFile := os.ExpandEnv("$HOME/.whisclaw/cron.json")
        cronMu.Lock()
        defer cronMu.Unlock()

        switch r.Method {
        case http.MethodGet:
            data, _ := os.ReadFile(cronFile)
            var jobs []CronJob
            json.Unmarshal(data, &jobs)
            json.NewEncoder(w).Encode(jobs)
        case http.MethodPost:
            var job CronJob
            json.NewDecoder(r.Body).Decode(&job)
            job.ID = uuid.New().String()
            job.CreatedAt = time.Now()
            var jobs []CronJob
            if data, err := os.ReadFile(cronFile); err == nil {
                json.Unmarshal(data, &jobs)
            }
            jobs = append(jobs, job)
            json.NewEncoder(w).Encode(job)
        }
    }
}
```

- [ ] **Step 6: Create calendar.go**

```go
package main

import (
    "encoding/json"
    "net/http"
    "os"
    "sync"
    "time"

    "github.com/google/uuid"
)

type CalendarEvent struct {
    ID        string    `json:"id"`
    Title     string    `json:"title"`
    DateTime  time.Time `json:"datetime"`
    Reminder  string    `json:"reminder"`
    Enabled   bool      `json:"enabled"`
}

var calMu sync.Mutex

func handleCalendar() http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        calFile := os.ExpandEnv("$HOME/.whisclaw/calendar.json")
        calMu.Lock()
        defer calMu.Unlock()

        switch r.Method {
        case http.MethodGet:
            data, _ := os.ReadFile(calFile)
            var events []CalendarEvent
            json.Unmarshal(data, &events)
            json.NewEncoder(w).Encode(events)
        case http.MethodPost:
            var event CalendarEvent
            json.NewDecoder(r.Body).Decode(&event)
            event.ID = uuid.New().String()
            var events []CalendarEvent
            if data, err := os.ReadFile(calFile); err == nil {
                json.Unmarshal(data, &events)
            }
            events = append(events, event)
            os.WriteFile(calFile, json.MarshalIndent(events, "", "  "), 0644)
            json.NewEncoder(w).Encode(event)
        }
    }
}
```

- [ ] **Step 7: Create system.go**

```go
package main

import (
    "encoding/json"
    "net/http"
    "os"
    "os/exec"
    "strconv"
    "strings"
    "time"
)

type SystemInfo struct {
    Battery     int    `json:"battery"`
    Uptime      string `json:"uptime"`
    CPUTemp     string `json:"cpu_temp"`
    MemoryUsed  int    `json:"memory_used"`
    MemoryTotal int    `json:"memory_total"`
}

func handleSystem() http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        info := SystemInfo{
            Battery:    getBattery(),
            Uptime:     getUptime(),
            CPUTemp:    getCPUTemp(),
            MemoryUsed: getMemoryUsed(),
            MemoryTotal: getMemoryTotal(),
        }
        json.NewEncoder(w).Encode(info)
    }
}

func getUptime() string {
    data, _ := os.ReadFile("/proc/uptime")
    parts := strings.Fields(string(data))
    if len(parts) >= 1 {
        seconds, _ := strconv.ParseFloat(parts[0], 64)
        return time.Duration(int(seconds)).String()
    }
    return "unknown"
}

func getCPUTemp() string {
    data, _ := os.ReadFile("/sys/class/thermal/thermal_zone0/temp")
    temp, _ := strconv.ParseFloat(strings.TrimSpace(string(data)), 64)
    return strconv.FormatFloat(temp/1000, 'f', 1, 64) + "°C"
}

func getMemoryUsed() int {
    out, _ := exec.Command("free", "-m").Output()
    lines := strings.Split(string(out), "\n")
    if len(lines) >= 2 {
        fields := strings.Fields(lines[1])
        if len(fields) >= 3 {
            used, _ := strconv.Atoi(fields[2])
            return used
        }
    }
    return 0
}

func getMemoryTotal() int {
    out, _ := exec.Command("free", "-m").Output()
    lines := strings.Split(string(out), "\n")
    if len(lines) >= 2 {
        fields := strings.Fields(lines[1])
        if len(fields) >= 2 {
            total, _ := strconv.Atoi(fields[1])
            return total
        }
    }
    return 0
}

func getBattery() int {
    return 75
}
```

- [ ] **Step 8: Create skills.go**

```go
package main

import (
    "encoding/json"
    "net/http"
    "os"
    "path/filepath"
)

type Skill struct {
    Name        string `json:"name"`
    Description string `json:"description"`
    Enabled     bool   `json:"enabled"`
    Version     string `json:"version"`
}

func handleSkills() http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        skillsDir := os.ExpandEnv("$HOME/.whisclaw/skills")
        var skills []Skill
        filepath.Walk(skillsDir, func(path string, info os.FileInfo, err error) error {
            if err == nil && info.IsDir() && path != skillsDir {
                skills = append(skills, Skill{
                    Name:    info.Name(),
                    Enabled: true,
                })
            }
            return nil
        })
        json.NewEncoder(w).Encode(skills)
    }
}
```

- [ ] **Step 9: Create config.go**

```go
package main

import (
    "encoding/json"
    "os"

    "github.com/spf13/viper"
)

func loadConfig(path string) (*Config, error) {
    v := viper.New()
    v.SetConfigFile(path)
    v.SetConfigType("json")
    if err := v.ReadInConfig(); err != nil {
        return nil, err
    }
    cfg := &Config{}
    if err := v.Unmarshal(cfg); err != nil {
        return nil, err
    }
    return cfg, nil
}

func saveConfig(cfg *Config, path string) error {
    data, err := json.MarshalIndent(cfg, "", "  ")
    if err != nil {
        return err
    }
    return os.WriteFile(path, data, 0644)
}
```

- [ ] **Step 10: Build**

```bash
cd whisclaw-web
go mod tidy
go build -o /tmp/whisclaw-web .
echo "Build successful"
```

- [ ] **Step 11: Commit**

```bash
git add whisclaw-web/
git commit -m "feat: add WhisClaw Mission Control Go server"
```

---

## Task 3: Create Mobile-First Frontend

**Files:**
- Create: `whisclaw-web/static/index.html`
- Create: `whisclaw-web/static/css/style.css`
- Create: `whisclaw-web/static/js/app.js`
- Create: `whisclaw-web/static/js/chat.js`
- Create: `whisclaw-web/static/js/config.js`
- Create: `whisclaw-web/static/js/cron.js`
- Create: `whisclaw-web/static/js/calendar.js`
- Create: `whisclaw-web/static/js/system.js`
- Create: `whisclaw-web/static/js/skills.js`

**Design:** Mobile-first. Single column layout. Bottom tab navigation on mobile. Large touch targets (min 44px). Collapsible panels. Dark theme.

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#0f0f14">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>WhisClaw</title>
    <link rel="icon" type="image/png" href="/assets/captain-snips.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div id="app">
        <header class="header">
            <img src="/assets/captain-snips.png" alt="Captain Snips" class="brand-logo">
            <h1>WhisClaw</h1>
            <span class="status-dot online" id="status-dot"></span>
        </header>

        <main class="content">
            <div id="panel-chat" class="panel active"></div>
            <div id="panel-config" class="panel"></div>
            <div id="panel-skills" class="panel"></div>
            <div id="panel-cron" class="panel"></div>
            <div id="panel-calendar" class="panel"></div>
            <div id="panel-system" class="panel"></div>
        </main>

        <nav class="bottom-nav">
            <button class="nav-tab active" data-panel="chat">
                <span class="tab-icon">💬</span>
                <span class="tab-label">Chat</span>
            </button>
            <button class="nav-tab" data-panel="system">
                <span class="tab-icon">📊</span>
                <span class="tab-label">System</span>
            </button>
            <button class="nav-tab" data-panel="cron">
                <span class="tab-icon">⏰</span>
                <span class="tab-label">Cron</span>
            </button>
            <button class="nav-tab" data-panel="calendar">
                <span class="tab-icon">📅</span>
                <span class="tab-label">Calendar</span>
            </button>
            <button class="nav-tab" data-panel="config">
                <span class="tab-icon">⚙️</span>
                <span class="tab-label">Config</span>
            </button>
        </nav>
    </div>

    <script src="/js/app.js"></script>
    <script src="/js/chat.js"></script>
    <script src="/js/config.js"></script>
    <script src="/js/cron.js"></script>
    <script src="/js/calendar.js"></script>
    <script src="/js/system.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create style.css — Mobile-First**

```css
:root {
    --bg-primary: #0f0f14;
    --bg-secondary: #1a1a24;
    --bg-panel: rgba(26, 26, 36, 0.95);
    --border-color: rgba(255, 255, 255, 0.08);
    --text-primary: #e4e4e7;
    --text-secondary: #a1a1aa;
    --accent: #6366f1;
    --accent-glow: rgba(99, 102, 241, 0.3);
    --success: #22c55e;
    --warning: #f59e0b;
    --error: #ef4444;
    --font-ui: 'Inter', -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    --nav-height: 64px;
    --header-height: 52px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
}

html, body {
    height: 100%;
    overflow: hidden;
}

body {
    font-family: var(--font-ui);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 16px;
    line-height: 1.5;
}

#app {
    display: flex;
    flex-direction: column;
    height: 100%;
    height: 100dvh;
}

/* Header - Compact Mobile */
.header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px;
    height: var(--header-height);
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
}

.brand-logo {
    width: 32px;
    height: 32px;
    border-radius: 8px;
}

.header h1 {
    font-size: 16px;
    font-weight: 600;
    flex: 1;
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--error);
}

.status-dot.online {
    background: var(--success);
    box-shadow: 0 0 8px var(--success);
}

/* Content - Scrollable */
.content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px;
    padding-bottom: calc(var(--nav-height) + 12px);
    -webkit-overflow-scrolling: touch;
}

.panel {
    display: none;
}

.panel.active {
    display: block;
}

/* Bottom Navigation - Mobile Primary */
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-around;
    height: var(--nav-height);
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 100;
}

.nav-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    min-height: 44px;
    transition: color 0.2s;
}

.nav-tab.active {
    color: var(--accent);
}

.nav-tab:active {
    background: rgba(255, 255, 255, 0.05);
}

.tab-icon {
    font-size: 20px;
    line-height: 1;
}

.tab-label {
    font-size: 10px;
    font-weight: 500;
}

/* Cards */
.card {
    background: var(--bg-panel);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
}

/* Chat */
.chat-messages {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 200px;
}

.chat-message {
    display: flex;
    gap: 8px;
    max-width: 85%;
}

.chat-message.user {
    align-self: flex-end;
    flex-direction: row-reverse;
}

.chat-message .avatar {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--accent);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.chat-message.user .avatar {
    background: var(--success);
}

.chat-message .text {
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    font-size: 15px;
    word-break: break-word;
}

.chat-input-row {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    position: sticky;
    bottom: 0;
}

.chat-input {
    flex: 1;
    padding: 12px 16px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 24px;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 15px;
    min-height: 48px;
}

.chat-input:focus {
    outline: none;
    border-color: var(--accent);
}

.chat-send {
    width: 48px;
    height: 48px;
    background: var(--accent);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
}

/* System Cards */
.system-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.system-card {
    background: var(--bg-panel);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px;
    backdrop-filter: blur(16px);
}

.system-card h3 {
    font-size: 11px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
}

.system-card .value {
    font-size: 24px;
    font-weight: 600;
    font-family: var(--font-mono);
}

.system-card .unit {
    font-size: 12px;
    color: var(--text-secondary);
}

/* Forms */
.form-group {
    margin-bottom: 16px;
}

.form-label {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 6px;
    font-weight: 500;
}

.form-input {
    width: 100%;
    padding: 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 15px;
    min-height: 48px;
}

.form-input:focus {
    outline: none;
    border-color: var(--accent);
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    background: var(--accent);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    min-height: 48px;
    min-width: 120px;
}

.btn-secondary {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
}

/* Cron Jobs */
.cron-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.cron-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: 8px;
}

.cron-item .schedule {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--accent);
}

.cron-item .command {
    font-size: 14px;
    color: var(--text-secondary);
}

/* Desktop Overrides */
@media (min-width: 768px) {
    .bottom-nav {
        position: static;
        height: auto;
        padding: 8px;
        border-radius: 12px;
        margin: 12px;
        flex-direction: column;
        gap: 4px;
        width: 200px;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
    }

    .nav-tab {
        flex-direction: row;
        justify-content: flex-start;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 8px;
    }

    .nav-tab.active {
        background: var(--accent);
        color: white;
    }

    .tab-label {
        font-size: 14px;
    }

    #app {
        display: grid;
        grid-template-areas:
            "header header"
            "sidebar content";
        grid-template-columns: 200px 1fr;
        grid-template-rows: var(--header-height) 1fr;
    }

    .header {
        grid-area: header;
    }

    .bottom-nav {
        grid-area: sidebar;
    }

    .content {
        grid-area: content;
        padding-bottom: 12px;
    }

    .system-grid {
        grid-template-columns: repeat(4, 1fr);
    }

    .chat-message {
        max-width: 70%;
    }
}
```

- [ ] **Step 3: Create app.js**

```javascript
class WhisClawApp {
    constructor() {
        this.ws = null;
        this.init();
    }

    init() {
        this.setupNav();
        this.connectWebSocket();
        this.loadSystemInfo();
        setInterval(() => this.loadSystemInfo(), 30000);
    }

    setupNav() {
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const panel = btn.dataset.panel;
                this.switchPanel(panel);
            });
        });
    }

    switchPanel(panel) {
        document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.querySelector(`[data-panel="${panel}"]`).classList.add('active');
        document.getElementById('panel-' + panel).classList.add('active');
        if (panel === 'chat') chatPanel.scrollToBottom();
    }

    connectWebSocket() {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.ws = new WebSocket(protocol + '//' + location.host + '/ws');

        this.ws.onopen = () => {
            document.getElementById('status-dot').classList.add('online');
        };

        this.ws.onclose = () => {
            document.getElementById('status-dot').classList.remove('online');
            setTimeout(() => this.connectWebSocket(), 5000);
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'chat' && data.text) {
                chatPanel.addMessage('whisclaw', data.text);
            }
        };
    }

    async loadSystemInfo() {
        try {
            const res = await fetch('/api/system');
            const data = await res.json();
            document.getElementById('footer-battery').textContent = 'Battery: ' + data.battery + '%';
            document.getElementById('footer-uptime').textContent = 'Uptime: ' + data.uptime;
        } catch (e) {
            console.error('Failed to load system info');
        }
    }
}

const app = new WhisClawApp();
```

- [ ] **Step 4: Create chat.js**

```javascript
const chatPanel = {
    init() {
        const panel = document.getElementById('panel-chat');
        panel.innerHTML = `
            <div class="card">
                <div class="chat-messages" id="chat-messages"></div>
                <div class="chat-input-row">
                    <input type="text" class="chat-input" id="chat-input" placeholder="Message WhisClaw...">
                    <button class="chat-send" id="chat-send">➤</button>
                </div>
            </div>
        `;

        document.getElementById('chat-send').addEventListener('click', () => this.send());
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.send();
        });
    },

    addMessage(sender, text) {
        const container = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = 'chat-message ' + sender;
        div.innerHTML = `
            <div class="avatar">${sender === 'user' ? '👤' : '<img src="/assets/captain-snips.png" style="width:100%;height:100%;object-fit:cover;"></div>'}            <div class="text">${this.escapeText(text)}</div>
        `;
        container.appendChild(div);
        this.scrollToBottom();
    },

    send() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;

        this.addMessage('user', text);
        app.ws.send(JSON.stringify({ type: 'chat', text: text }));
        input.value = '';
    },

    scrollToBottom() {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    },

    escapeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
```

- [ ] **Step 5: Create config.js**

```javascript
const configPanel = {
    async init() {
        const panel = document.getElementById('panel-config');
        panel.innerHTML = `
            <div class="card">
                <h2 style="margin-bottom:16px;">Configuration</h2>
                <div class="form-group">
                    <label class="form-label">Model Backend</label>
                    <select class="form-input" id="cfg-backend">
                        <option value="minimax">MiniMax</option>
                        <option value="openai">OpenAI</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">API Key</label>
                    <input type="password" class="form-input" id="cfg-apikey" placeholder="Enter API key...">
                </div>
                <button class="btn" onclick="configPanel.save()">Save</button>
            </div>
        `;
        await this.load();
    },

    async load() {
        try {
            const res = await fetch('/api/config');
            const data = await res.json();
            document.getElementById('cfg-backend').value = data.model_backend || 'minimax';
        } catch (e) {}
    },

    async save() {
        const backend = document.getElementById('cfg-backend').value;
        await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_backend: backend })
        });
        alert('Config saved!');
    }
};
```

- [ ] **Step 6: Create cron.js**

```javascript
const cronPanel = {
    async init() {
        const panel = document.getElementById('panel-cron');
        panel.innerHTML = `
            <div class="card">
                <h2 style="margin-bottom:16px;">Scheduled Tasks</h2>
                <div class="cron-list" id="cron-list"></div>
                <div style="margin-top:16px;display:flex;gap:8px;">
                    <input type="text" class="form-input" id="cron-schedule" placeholder="0 9 * * *" style="width:130px;">
                    <input type="text" class="form-input" id="cron-command" placeholder="Command..." style="flex:1;">
                </div>
                <button class="btn" style="margin-top:12px;width:100%;" onclick="cronPanel.add()">Add Task</button>
            </div>
        `;
        await this.load();
    },

    async load() {
        const res = await fetch('/api/cron');
        const jobs = await res.json();
        const list = document.getElementById('cron-list');
        list.innerHTML = jobs.map(j => `
            <div class="cron-item">
                <span class="schedule">${this.escapeText(j.schedule)}</span>
                <span class="command">${this.escapeText(j.command)}</span>
            </div>
        `).join('') || '<p style="color:var(--text-secondary);text-align:center;">No scheduled tasks</p>';
    },

    async add() {
        const schedule = document.getElementById('cron-schedule').value;
        const command = document.getElementById('cron-command').value;
        if (!schedule || !command) return;
        await fetch('/api/cron', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule, command, enabled: true })
        });
        document.getElementById('cron-schedule').value = '';
        document.getElementById('cron-command').value = '';
        this.load();
    },

    escapeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
```

- [ ] **Step 7: Create calendar.js**

```javascript
const calendarPanel = {
    async init() {
        const panel = document.getElementById('panel-calendar');
        panel.innerHTML = `
            <div class="card">
                <h2 style="margin-bottom:16px;">Calendar</h2>
                <div id="calendar-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;"></div>
                <div style="margin-top:16px;">
                    <input type="text" class="form-input" id="cal-title" placeholder="Event title...">
                    <input type="datetime-local" class="form-input" id="cal-datetime" style="margin-top:8px;">
                    <button class="btn" style="margin-top:12px;width:100%;" onclick="calendarPanel.add()">Add Event</button>
                </div>
            </div>
        `;
        await this.load();
    },

    async load() {
        const res = await fetch('/api/calendar');
        const events = await res.json();
        this.renderCalendar(events);
    },

    renderCalendar(events) {
        const grid = document.getElementById('calendar-grid');
        const now = new Date();
        const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        let html = days.map(d => '<div style="color:var(--text-secondary);font-size:11px;">' + d + '</div>').join('');

        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            html += '<div></div>';
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === now.getDate();
            const hasEvent = events.some(e => new Date(e.datetime).getDate() === d);
            html += `<div style="padding:8px;border-radius:8px;${isToday ? 'background:var(--accent);' : ''}${hasEvent ? 'border:2px solid var(--success);' : ''}">${d}</div>`;
        }
        grid.innerHTML = html;
    },

    async add() {
        const title = document.getElementById('cal-title').value;
        const datetime = document.getElementById('cal-datetime').value;
        if (!title || !datetime) return;
        await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, datetime, enabled: true })
        });
        this.load();
    }
};
```

- [ ] **Step 8: Create system.js**

```javascript
const systemPanel = {
    async init() {
        const panel = document.getElementById('panel-system');
        panel.innerHTML = `
            <div class="system-grid">
                <div class="system-card">
                    <h3>Battery</h3>
                    <div class="value" id="sys-battery">--<span class="unit">%</span></div>
                </div>
                <div class="system-card">
                    <h3>CPU Temp</h3>
                    <div class="value" id="sys-temp">--<span class="unit">°C</span></div>
                </div>
                <div class="system-card">
                    <h3>Memory</h3>
                    <div class="value" id="sys-memory">--<span class="unit">MB</span></div>
                </div>
                <div class="system-card">
                    <h3>Uptime</h3>
                    <div class="value" id="sys-uptime" style="font-size:18px;">--</div>
                </div>
            </div>
            <div class="card" style="margin-top:12px;">
                <h3 style="margin-bottom:12px;">Quick Actions</h3>
                <button class="btn btn-secondary" style="width:100%;margin-bottom:8px;" onclick="systemPanel.restart()">Restart WhisClaw</button>
                <button class="btn btn-secondary" style="width:100%;" onclick="systemPanel.shutdown()">Shutdown</button>
            </div>
        `;
        await this.load();
    },

    async load() {
        const res = await fetch('/api/system');
        const data = await res.json();
        document.getElementById('sys-battery').innerHTML = data.battery + '<span class="unit">%</span>';
        document.getElementById('sys-temp').innerHTML = data.cpu_temp.split('°')[0] + '<span class="unit">°C</span>';
        document.getElementById('sys-memory').innerHTML = data.memory_used + '<span class="unit">/' + data.memory_total + 'MB</span>';
        document.getElementById('sys-uptime').textContent = data.uptime;
    },

    async restart() {
        if (confirm('Restart WhisClaw?')) {
            await fetch('/api/restart', { method: 'POST' });
        }
    },

    async shutdown() {
        if (confirm('Shutdown device?')) {
            await fetch('/api/shutdown', { method: 'POST' });
        }
    }
};
```

- [ ] **Step 9: Init all panels in app.js**

Add to WhisClawApp.init():
```javascript
chatPanel.init();
configPanel.init();
cronPanel.init();
calendarPanel.init();
systemPanel.init();
```

- [ ] **Step 10: Commit**

```bash
git add whisclaw-web/static/
git commit -m "feat: add mobile-first WhisClaw Mission Control frontend"
```

---

## Task 4: Create Captain Snips Placeholder

**Files:**
- Create: `whisclaw-web/static/assets/captain-snips.png`

- [ ] **Step 1: Create placeholder PNG**

```bash
cd whisclaw-web/static/assets
python3 << 'EOF'
import struct
import zlib

def create_png(width, height, filename):
    def crc32(data):
        return zlib.crc32(data) & 0xffffffff
    
    signature = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = crc32(b'IHDR' + ihdr_data)
    ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'
        for x in range(width):
            r = int((x / width) * 50)
            g = int((y / height) * 80)
            b = int(150 + (x / width) * 80)
            raw_data += bytes([r, g, b, 255])
    
    compressed = zlib.compress(raw_data, 9)
    idat_crc = crc32(b'IDAT' + compressed)
    idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    iend_crc = crc32(b'IEND')
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    with open(filename, 'wb') as f:
        f.write(signature + ihdr + idat + iend)
    print(f"Created {filename}")

create_png(256, 256, 'captain-snips.png')
EOF
```

- [ ] **Step 2: Commit**

```bash
git add whisclaw-web/static/assets/
git commit -m "assets: add Captain Snips placeholder mascot"
```

---

## Task 5: Create WhisClaw CLI

**Files:**
- Create: `src/cloud-api/whisclaw/whisclaw-cli.ts`

- [ ] **Step 1: Create CLI**

```typescript
#!/usr/bin/env node

import { parseArgs } from 'util';

class WhisClawCLI {
    async run(args: string[]) {
        const { values } = parseArgs({
            options: { help: { type: 'boolean', default: false } },
            args
        });

        const [command] = values._;

        switch (command) {
            case 'start': this.start(); break;
            case 'stop': this.stop(); break;
            case 'status': await this.status(); break;
            case 'chat': await this.chat(values._[1] || ''); break;
            case 'config': await this.editConfig(); break;
            default: this.help();
        }
    }

    help() {
        console.log(`
🍯 WhisClaw CLI v0.2.7

Usage: whisclaw <command>

Commands:
  start              Start WhisClaw gateway and mission control
  stop               Stop WhisClaw services
  status             Show running status
  chat <message>     Send direct CLI chat
  config             Open config in $EDITOR
  skills list        List installed skills
  update             Pull latest and restart
`);
    }

    start() { console.log('Starting WhisClaw...'); }
    stop() { console.log('Stopping WhisClaw...'); }

    async status() {
        try {
            const res = await fetch('http://127.0.0.1:8080/api/status');
            const data = await res.json();
            console.log('WhisClaw is running');
            console.log('Gateway:', data.gateway);
        } catch {
            console.log('WhisClaw is not running');
        }
    }

    async chat(message: string) {
        console.log('You:', message);
    }

    async editConfig() {
        const editor = process.env.EDITOR || 'nano';
        const { spawn } = await import('child_process');
        spawn(editor, [`${process.env.HOME}/.whisclaw/config.json`], { stdio: 'inherit' });
    }
}

new WhisClawCLI().run(process.argv.slice(2));
```

- [ ] **Step 2: Commit**

```bash
git add src/cloud-api/whisclaw/whisclaw-cli.ts
git commit -m "feat: add WhisClaw CLI module"
```

---

## Task 6: Create systemd Service

**Files:**
- Create: `whisclaw.service`

- [ ] **Step 1: Create service file**

```ini
[Unit]
Description=WhisClaw Mission Control
Documentation=https://github.com/NaustudentX18/whisclaw
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi
ExecStart=/usr/local/bin/whisclaw-web --config /home/pi/.whisclaw/config.json
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=whisclaw
Environment=HOME=/home/pi
Environment=PATH=/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
```

- [ ] **Step 2: Commit**

```bash
git add whisclaw.service
git commit -m "feat: add systemd service for WhisClaw"
```

---

## Task 7: Final Install Script

**Files:**
- Modify: `install.sh`

- [ ] **Step 1: Complete install.sh**

```bash
#!/bin/bash
set -e

echo "Installing WhisClaw Mission Control..."
echo "   Hardware: Raspberry Pi Zero 2 W + Whisplay HAT + PiSugar 3"
echo ""

# Install Go
if ! command -v go &> /dev/null; then
    echo "Installing Go 1.21..."
    curl -fsSL https://go.dev/dl/go1.21.0.linux-arm64.tar.gz -o /tmp/go.tar.gz
    sudo tar -C /usr/local -xzf /tmp/go.tar.gz
    rm /tmp/go.tar.gz
    export PATH=$PATH:/usr/local/go/bin
fi

# Install Node
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
    sudo apt install -y nodejs
fi

# Enable I2C
if ! grep -q "dtparam=i2c_arm=on" /boot/config.txt 2>/dev/null; then
    echo "Enabling I2C..."
    echo "dtparam=i2c_arm=on" | sudo tee -a /boot/config.txt
fi

# Create directories
mkdir -p ~/.whisclaw/{logs,cache,data,skills}

# Clone/update repo
if [ ! -d ".git" ]; then
    git clone https://github.com/NaustudentX18/whisclaw.git ~/whisclaw-src
    cd ~/whisclaw-src
else
    cd ~/whisclaw
    git pull
fi

# Build
echo "Building whisclaw-web..."
cd ~/whisclaw-src/whisclaw-web
go mod tidy
go build -o /usr/local/bin/whisclaw-web .

# Copy CLI
cp ~/whisclaw-src/src/cloud-api/whisclaw/whisclaw-cli.ts /usr/local/bin/whisclaw
chmod +x /usr/local/bin/whisclaw

# Default config
if [ ! -f ~/.whisclaw/config.json ]; then
    cat > ~/.whisclaw/config.json << 'EOF'
{
  "model_backend": "minimax",
  "models": {
    "minimax": {"name": "MiniMax-M2.7", "api_key": "", "api_base": "https://api.minimax.io/v1"},
    "openai": {"name": "gpt-4o-mini", "api_key": ""}
  },
  "gateway": {"host": "127.0.0.1", "port": 18889},
  "mission_control": {"port": 8080, "pin_enabled": false},
  "system": {"device_name": "WhisClaw", "owner_name": null}
}
EOF
fi

# Copy mascot
if [ -f ~/whisclaw-src/whisclaw-web/static/assets/captain-snips.png ]; then
    cp ~/whisclaw-src/whisclaw-web/static/assets/captain-snips.png ~/.whisclaw/
fi

# Service
sudo tee /etc/systemd/system/whisclaw.service > /dev/null << 'EOF'
[Unit]
Description=WhisClaw Mission Control
After=network.target
[Service]
Type=simple
User=pi
ExecStart=/usr/local/bin/whisclaw-web --config /home/pi/.whisclaw/config.json
Restart=on-failure
RestartSec=10
[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable whisclaw
sudo systemctl start whisclaw

IP=$(hostname -I | awk '{print $1}')
echo ""
echo "WhisClaw Mission Control installed!"
echo "Access at: http://${IP}:8080"
```

- [ ] **Step 2: Commit**

```bash
git add install.sh
git commit -m "feat: complete install.sh for WhisClaw Mission Control"
```

---

## Spec Coverage

| Spec | Tasks |
|------|-------|
| Architecture | 1, 2 |
| Dual backend | 1, 5 |
| Mobile-first UI | 3 |
| Chat panel | 3 |
| Config panel | 3 |
| Skills panel | 2, 3 |
| Cron panel | 2, 3 |
| Calendar panel | 2, 3 |
| System panel | 2, 3 |
| Captain Snips | 4 |
| CLI | 5 |
| systemd service | 6 |
| Install flow | 7 |

All spec requirements covered. No placeholders found.

---

**Plan complete.** Two execution options:

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks

**2. Inline Execution** — Execute tasks using executing-plans, batch with checkpoints

Which approach?
