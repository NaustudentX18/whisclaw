/**
 * WhisClawSystem - System panel functionality
 */
class WhisClawSystem {
    static batteryValue = null;
    static cpuTempValue = null;
    static memoryValue = null;
    static uptimeValue = null;
    static restartBtn = null;
    static shutdownBtn = null;

    /**
     * Initialize system panel
     */
    static init() {
        this.batteryValue = document.getElementById('battery-value');
        this.cpuTempValue = document.getElementById('cpu-temp-value');
        this.memoryValue = document.getElementById('memory-value');
        this.uptimeValue = document.getElementById('uptime-value');
        this.restartBtn = document.getElementById('restart-btn');
        this.shutdownBtn = document.getElementById('shutdown-btn');

        if (!this.batteryValue || !this.cpuTempValue) {
            console.error('System elements not found');
            return;
        }

        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => this.restart());
        }
        if (this.shutdownBtn) {
            this.shutdownBtn.addEventListener('click', () => this.shutdown());
        }
    }

    /**
     * Update system data display
     * @param {Object} data - System data from API
     */
    static updateData(data) {
        if (!data) return;

        // Battery
        if (data.battery !== undefined) {
            this.batteryValue.textContent = `${data.battery}%`;
            if (data.battery_charging !== undefined) {
                this.batteryValue.textContent += data.battery_charging ? ' (charging)' : '';
            }
        }

        // CPU Temperature
        if (data.cpu_temp !== undefined) {
            this.cpuTempValue.textContent = `${data.cpu_temp}°C`;
        } else if (data.temperature !== undefined) {
            this.cpuTempValue.textContent = `${data.temperature}°C`;
        }

        // Memory
        if (data.memory !== undefined) {
            if (typeof data.memory === 'object') {
                const used = data.memory.used || 0;
                const total = data.memory.total || 1;
                const percent = Math.round((used / total) * 100);
                this.memoryValue.textContent = `${percent}%`;
            } else {
                this.memoryValue.textContent = `${data.memory}%`;
            }
        }

        // Uptime
        if (data.uptime !== undefined) {
            this.uptimeValue.textContent = this.formatUptime(data.uptime);
        }
    }

    /**
     * Format uptime in seconds to human readable
     * @param {number} seconds - Uptime in seconds
     * @returns {string} - Formatted uptime
     */
    static formatUptime(seconds) {
        if (!seconds) return '--';

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    /**
     * Restart the system
     */
    static async restart() {
        if (!confirm('Are you sure you want to restart the system?')) {
            return;
        }

        try {
            const response = await fetch('/api/system/restart', {
                method: 'POST'
            });

            if (response.ok) {
                this.showSuccess('Restart initiated');
            } else {
                this.showError('Failed to restart');
            }
        } catch (error) {
            console.error('Failed to restart:', error);
            this.showError('Failed to restart system');
        }
    }

    /**
     * Shutdown the system
     */
    static async shutdown() {
        if (!confirm('Are you sure you want to shutdown the system?')) {
            return;
        }

        try {
            const response = await fetch('/api/system/shutdown', {
                method: 'POST'
            });

            if (response.ok) {
                this.showSuccess('Shutdown initiated');
            } else {
                this.showError('Failed to shutdown');
            }
        } catch (error) {
            console.error('Failed to shutdown:', error);
            this.showError('Failed to shutdown system');
        }
    }

    /**
     * Show success message
     * @param {string} message
     */
    static showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * Show error message
     * @param {string} message
     */
    static showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Show toast notification
     * @param {string} message
     * @param {string} type - 'success' or 'error'
     */
    static showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background: ${type === 'success' ? 'var(--success)' : 'var(--danger)'};
            color: white;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}
