/**
 * WhisClawConfig - Configuration panel functionality
 */
class WhisClawConfig {
    static configForm = null;
    static backendSelect = null;
    static apiKeyInput = null;
    static modelInput = null;

    /**
     * Initialize config panel
     */
    static init() {
        this.configForm = document.getElementById('config-form');
        this.backendSelect = document.getElementById('backend-select');
        this.apiKeyInput = document.getElementById('api-key-input');
        this.modelInput = document.getElementById('model-input');

        if (!this.configForm) {
            console.error('Config form not found');
            return;
        }

        this.configForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });

        // Load current config
        this.load();
    }

    /**
     * Load current configuration from server
     */
    static async load() {
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const data = await response.json();
                this.updateForm(data);
            }
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    }

    /**
     * Update form with config data
     * @param {Object} data - Configuration data
     */
    static updateForm(data) {
        if (this.backendSelect && data.backend) {
            this.backendSelect.value = data.backend;
        }
        if (this.apiKeyInput && data.api_key) {
            // Only show masked API key for security
            this.apiKeyInput.placeholder = '••••••••••••••••';
        }
        if (this.modelInput && data.model) {
            this.modelInput.value = data.model;
        }
    }

    /**
     * Save configuration to server
     */
    static async save() {
        const config = {
            backend: this.backendSelect?.value,
            api_key: this.apiKeyInput?.value || undefined,
            model: this.modelInput?.value || undefined
        };

        // Remove undefined values
        Object.keys(config).forEach(key => {
            if (config[key] === undefined) {
                delete config[key];
            }
        });

        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                this.showSuccess('Configuration saved successfully');
                // Clear API key field after save
                if (this.apiKeyInput) {
                    this.apiKeyInput.value = '';
                    this.apiKeyInput.placeholder = 'API key saved';
                }
            } else {
                const error = await response.json();
                this.showError('Failed to save config: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to save config:', error);
            this.showError('Failed to save configuration');
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
            animation: fadeIn 0.3s ease;
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}
