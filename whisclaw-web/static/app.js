/**
 * WhisClawApp - Main application class
 * Handles navigation, WebSocket connection, and system polling
 */
class WhisClawApp {
    constructor() {
        this.ws = null;
        this.wsConnected = false;
        this.systemPollInterval = null;
        this.currentPanel = 'chat';

        // Panel references
        this.panels = {
            chat: document.getElementById('chat-panel'),
            system: document.getElementById('system-panel'),
            cron: document.getElementById('cron-panel'),
            calendar: document.getElementById('calendar-panel'),
            config: document.getElementById('config-panel')
        };

        this.init();
    }

    init() {
        this.setupNav();
        this.connectWebSocket();
        this.loadSystemInfo();
        this.startSystemPolling();

        // Initialize all panels
        if (typeof WhisClawChat !== 'undefined') {
            WhisClawChat.init();
        }
        if (typeof WhisClawConfig !== 'undefined') {
            WhisClawConfig.init();
        }
        if (typeof WhisClawCron !== 'undefined') {
            WhisClawCron.init();
        }
        if (typeof WhisClawCalendar !== 'undefined') {
            WhisClawCalendar.init();
        }
        if (typeof WhisClawSystem !== 'undefined') {
            WhisClawSystem.init();
        }
    }

    /**
     * Set up navigation tab click handlers
     */
    setupNav() {
        // Bottom navigation tabs
        const bottomTabs = document.querySelectorAll('.nav-tab');
        bottomTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const panel = tab.dataset.panel;
                this.switchPanel(panel);
            });
        });

        // Sidebar navigation items
        const sidebarItems = document.querySelectorAll('.nav-item');
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                const panel = item.dataset.panel;
                this.switchPanel(panel);
            });
        });
    }

    /**
     * Switch between panels
     * @param {string} panelName - Name of the panel to show
     */
    switchPanel(panelName) {
        // Update current panel
        this.currentPanel = panelName;

        // Hide all panels
        Object.values(this.panels).forEach(panel => {
            panel.classList.add('hidden');
        });

        // Show selected panel
        if (this.panels[panelName]) {
            this.panels[panelName].classList.remove('hidden');
        }

        // Update active state on both navs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.panel === panelName);
        });
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.panel === panelName);
        });
    }

    /**
     * Connect to WebSocket endpoint
     */
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.wsConnected = true;
                this.updateWsStatus(true);
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.wsConnected = false;
                this.updateWsStatus(false);
                // Attempt reconnect after 5 seconds
                setTimeout(() => this.connectWebSocket(), 5000);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.wsConnected = false;
                this.updateWsStatus(false);
            };

            this.ws.onmessage = (event) => {
                this.handleWsMessage(event.data);
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.updateWsStatus(false);
        }
    }

    /**
     * Update WebSocket status indicator
     * @param {boolean} connected
     */
    updateWsStatus(connected) {
        const statusDot = document.getElementById('ws-status');
        if (statusDot) {
            statusDot.classList.toggle('connected', connected);
            statusDot.classList.toggle('disconnected', !connected);
        }
    }

    /**
     * Handle incoming WebSocket messages
     * @param {string} data - JSON message data
     */
    handleWsMessage(data) {
        try {
            const message = JSON.parse(data);
            switch (message.type) {
                case 'chat_response':
                    if (typeof WhisClawChat !== 'undefined') {
                        WhisClawChat.addMessage('WhisClaw', message.text);
                    }
                    break;
                case 'system_update':
                    if (typeof WhisClawSystem !== 'undefined') {
                        WhisClawSystem.updateData(message.data);
                    }
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    /**
     * Send message via WebSocket
     * @param {string} text - Message text to send
     */
    sendMessage(text) {
        if (this.ws && this.wsConnected) {
            this.ws.send(JSON.stringify({
                type: 'chat_message',
                text: text
            }));
            return true;
        }
        return false;
    }

    /**
     * Load initial system info
     */
    async loadSystemInfo() {
        try {
            const response = await fetch('/api/system');
            if (response.ok) {
                const data = await response.json();
                if (typeof WhisClawSystem !== 'undefined') {
                    WhisClawSystem.updateData(data);
                }
            }
        } catch (error) {
            console.error('Failed to load system info:', error);
        }
    }

    /**
     * Start polling system info every 30 seconds
     */
    startSystemPolling() {
        this.systemPollInterval = setInterval(() => {
            this.loadSystemInfo();
        }, 30000);
    }

    /**
     * Stop polling system info
     */
    stopSystemPolling() {
        if (this.systemPollInterval) {
            clearInterval(this.systemPollInterval);
            this.systemPollInterval = null;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.whisclawApp = new WhisClawApp();
});
