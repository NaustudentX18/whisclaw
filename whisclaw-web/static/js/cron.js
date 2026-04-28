// WhisClaw Cron Jobs Module

const Cron = {
  jobs: [],

  init() {
    this.cronList = document.getElementById('cron-list');
    this.addCronForm = document.getElementById('add-cron-form');

    if (!this.cronList || !this.addCronForm) return;

    this.addCronForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addJob();
    });

    this.loadJobs();
  },

  async loadJobs() {
    try {
      const jobs = await App.apiFetch('/api/cron');
      this.jobs = Array.isArray(jobs) ? jobs : [];
      this.renderJobs();
    } catch (error) {
      console.error('Failed to load cron jobs:', error);
      this.renderJobs();
    }
  },

  renderJobs() {
    if (!this.cronList) return;

    if (this.jobs.length === 0) {
      this.cronList.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No cron jobs configured.</p>';
      return;
    }

    this.cronList.innerHTML = this.jobs.map(job => `
      <div class="cron-item" data-id="${job.id || job.name}">
        <div class="cron-info">
          <h4>${this.escapeHtml(job.name)}</h4>
          <p>${this.escapeHtml(job.schedule)}</p>
          <p>Next: ${job.nextRun || 'N/A'}</p>
        </div>
        <div class="cron-actions">
          <label class="toggle-switch">
            <input type="checkbox" ${job.enabled ? 'checked' : ''} data-id="${job.id || job.name}">
            <span class="toggle-slider"></span>
          </label>
          <button class="delete-btn" data-id="${job.id || job.name}">Delete</button>
        </div>
      </div>
    `).join('');

    // Attach event listeners
    this.cronList.querySelectorAll('.toggle-switch input').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        this.toggleJob(e.target.dataset.id, e.target.checked);
      });
    });

    this.cronList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.deleteJob(e.target.dataset.id);
      });
    });
  },

  async addJob() {
    const nameInput = document.getElementById('cron-name');
    const scheduleInput = document.getElementById('cron-schedule');
    const commandInput = document.getElementById('cron-command');

    const name = nameInput.value.trim();
    const schedule = scheduleInput.value.trim();
    const command = commandInput.value.trim();

    if (!name || !schedule || !command) return;

    try {
      await App.apiFetch('/api/cron', {
        method: 'POST',
        body: JSON.stringify({ name, schedule, command })
      });

      // Clear form
      nameInput.value = '';
      scheduleInput.value = '';
      commandInput.value = '';

      // Reload jobs
      this.loadJobs();
    } catch (error) {
      console.error('Failed to add cron job:', error);
      App.showToast('Failed to add cron job', 'error');
    }
  },

  async toggleJob(id, enabled) {
    try {
      await App.apiFetch(`/api/cron/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled })
      });
    } catch (error) {
      console.error('Failed to toggle cron job:', error);
      this.loadJobs(); // Revert on error
    }
  },

  async deleteJob(id) {
    if (!confirm('Delete this cron job?')) return;

    try {
      await App.apiFetch(`/api/cron/${id}`, {
        method: 'DELETE'
      });
      this.loadJobs();
    } catch (error) {
      console.error('Failed to delete cron job:', error);
      App.showToast('Failed to delete cron job', 'error');
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
