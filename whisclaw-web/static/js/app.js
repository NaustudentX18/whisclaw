// WhisClaw App - Main Entry Point

const App = {
  backendUrl: 'http://localhost:8080',
  wsUrl: 'ws://localhost:8080/ws',

  init() {
    this.loadConfig();
    this.initTabSwitching();
    this.initPanels();
  },

  loadConfig() {
    const saved = localStorage.getItem('whisclaw-config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        this.backendUrl = config.backend || this.backendUrl;
        this.wsUrl = `${this.backendUrl.replace('http', 'ws')}/ws`;
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }
  },

  saveConfig(config) {
    localStorage.setItem('whisclaw-config', JSON.stringify(config));
    this.backendUrl = config.backend || this.backendUrl;
    this.wsUrl = `${this.backendUrl.replace('http', 'ws')}/ws`;
  },

  initTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPanel = btn.dataset.panel;

        // Update active tab button
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show target panel, hide others
        panels.forEach(panel => {
          if (panel.id === `${targetPanel}-panel`) {
            panel.classList.remove('hidden');
          } else {
            panel.classList.add('hidden');
          }
        });
      });
    });
  },

  initPanels() {
    if (typeof Chat !== 'undefined') Chat.init();
    if (typeof System !== 'undefined') System.init();
    if (typeof Cron !== 'undefined') Cron.init();
    if (typeof Calendar !== 'undefined') Calendar.init();
    if (typeof Config !== 'undefined') Config.init();
  },

  async apiFetch(endpoint, options = {}) {
    const url = `${this.backendUrl}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      console.error(`API fetch failed for ${endpoint}:`, error);
      throw error;
    }
  },

  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type}`;

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
