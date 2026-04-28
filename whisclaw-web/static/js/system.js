// WhisClaw System Status Module

const System = {
  pollInterval: null,
  pollDelay: 5000,

  init() {
    this.statsContainer = document.getElementById('system-stats');
    if (!this.statsContainer) return;

    this.loadStatus();
    this.startPolling();
  },

  startPolling() {
    this.pollInterval = setInterval(() => {
      this.loadStatus();
    }, this.pollDelay);
  },

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  },

  async loadStatus() {
    try {
      const data = await App.apiFetch('/api/status');
      this.renderStats(data);
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  },

  renderStats(data) {
    if (!this.statsContainer) return;

    const battery = data.battery ?? 0;
    const cpu = data.cpu ?? 0;
    const memory = data.memory ?? 0;
    const uptime = data.uptime ?? 'Unknown';

    const batteryColor = this.getBatteryColor(battery);
    const batteryClass = this.getBatteryClass(battery);

    this.statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Battery</div>
        <div class="stat-value ${batteryClass}">${battery}%</div>
        <div class="battery-gauge">
          <div class="battery-fill" style="width: ${battery}%; background: ${batteryColor};"></div>
        </div>
        ${battery <= 20 ? '<p style="color: var(--danger-color); font-size: 0.8rem; margin-top: 8px;">Shell battery is low</p>' : ''}
      </div>
      <div class="stat-card">
        <div class="stat-label">CPU</div>
        <div class="stat-value ${this.getUsageClass(cpu)}">${cpu}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Memory</div>
        <div class="stat-value ${this.getUsageClass(memory)}">${memory}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Uptime</div>
        <div class="stat-value">${this.formatUptime(uptime)}</div>
      </div>
    `;
  },

  getBatteryColor(battery) {
    if (battery > 50) return 'var(--success-color)';
    if (battery > 20) return 'var(--warning-color)';
    return 'var(--danger-color)';
  },

  getBatteryClass(battery) {
    if (battery > 50) return 'good';
    if (battery > 20) return 'medium';
    return 'low';
  },

  getUsageClass(usage) {
    if (usage < 50) return 'good';
    if (usage < 80) return 'medium';
    return 'low';
  },

  formatUptime(uptime) {
    if (typeof uptime === 'number') {
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);

      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }
    return uptime;
  }
};
