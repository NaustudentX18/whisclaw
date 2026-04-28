// WhisClaw Configuration Module

const Config = {
  init() {
    this.configForm = document.getElementById('config-form');
    if (!this.configForm) return;

    this.configForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveConfig();
    });

    this.loadConfig();
  },

  async loadConfig() {
    try {
      const data = await App.apiFetch('/api/config');
      this.renderConfig(data);
    } catch (error) {
      console.error('Failed to load config:', error);
      // Try to load from localStorage as fallback
      const saved = localStorage.getItem('whisclaw-config');
      if (saved) {
        try {
          const config = JSON.parse(saved);
          this.renderConfig(config);
        } catch (e) {
          console.error('Failed to parse saved config:', e);
        }
      }
    }
  },

  renderConfig(data) {
    const backendInput = document.getElementById('config-backend');
    const modelInput = document.getElementById('config-model');
    const apiUrlInput = document.getElementById('config-api-url');

    if (data.backend && backendInput) backendInput.value = data.backend;
    if (data.model && modelInput) modelInput.value = data.model;
    if (data.api_url && apiUrlInput) apiUrlInput.value = data.api_url;
  },

  async saveConfig() {
    const backendInput = document.getElementById('config-backend');
    const modelInput = document.getElementById('config-model');
    const apiUrlInput = document.getElementById('config-api-url');

    const config = {
      backend: backendInput?.value.trim() || 'http://localhost:8080',
      model: modelInput?.value.trim() || '',
      api_url: apiUrlInput?.value.trim() || ''
    };

    try {
      await App.apiFetch('/api/config', {
        method: 'POST',
        body: JSON.stringify(config)
      });

      // Save to localStorage
      App.saveConfig(config);

      App.showToast('Configuration saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save config:', error);
      App.showToast('Failed to save configuration', 'error');
    }
  }
};
