/**
 * WhisClawCron - Cron jobs panel functionality
 */
class WhisClawCron {
    static cronForm = null;
    static cronJobs = null;
    static cronName = null;
    static cronCommand = null;
    static cronSchedule = null;

    /**
     * Initialize cron panel
     */
    static init() {
        this.cronForm = document.getElementById('cron-form');
        this.cronJobs = document.getElementById('cron-jobs');
        this.cronName = document.getElementById('cron-name');
        this.cronCommand = document.getElementById('cron-command');
        this.cronSchedule = document.getElementById('cron-schedule');

        if (!this.cronForm || !this.cronJobs) {
            console.error('Cron elements not found');
            return;
        }

        this.cronForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.add();
        });

        // Load existing jobs
        this.load();
    }

    /**
     * Load cron jobs from server
     */
    static async load() {
        try {
            const response = await fetch('/api/cron');
            if (response.ok) {
                const data = await response.json();
                this.renderJobs(data.jobs || []);
            }
        } catch (error) {
            console.error('Failed to load cron jobs:', error);
            this.renderJobs([]);
        }
    }

    /**
     * Render cron jobs list
     * @param {Array} jobs - List of cron jobs
     */
    static renderJobs(jobs) {
        if (!this.cronJobs) return;

        if (jobs.length === 0) {
            this.cronJobs.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 24px;">
                    No cron jobs configured
                </div>
            `;
            return;
        }

        this.cronJobs.innerHTML = jobs.map(job => `
            <div class="job-item" data-id="${this.escapeHtml(job.id || job.name)}">
                <div class="job-name">${this.escapeHtml(job.name)}</div>
                <div class="job-schedule">${this.escapeHtml(job.schedule)}</div>
                <div class="job-command">${this.escapeHtml(job.command)}</div>
            </div>
        `).join('');
    }

    /**
     * Add new cron job
     */
    static async add() {
        const name = this.cronName?.value?.trim();
        const command = this.cronCommand?.value?.trim();
        const schedule = this.cronSchedule?.value?.trim();

        if (!name || !command || !schedule) {
            this.showError('All fields are required');
            return;
        }

        try {
            const response = await fetch('/api/cron', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, command, schedule })
            });

            if (response.ok) {
                // Clear form
                if (this.cronName) this.cronName.value = '';
                if (this.cronCommand) this.cronCommand.value = '';
                if (this.cronSchedule) this.cronSchedule.value = '';

                this.showSuccess('Cron job added');
                // Reload jobs
                this.load();
            } else {
                const error = await response.json();
                this.showError('Failed to add job: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to add cron job:', error);
            this.showError('Failed to add cron job');
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text
     * @returns {string}
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
