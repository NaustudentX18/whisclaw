// WhisClaw Calendar Module

const Calendar = {
  currentDate: new Date(),
  events: [],

  init() {
    this.calendarGrid = document.getElementById('calendar-grid');
    this.currentMonthEl = document.getElementById('current-month');
    this.eventModal = document.getElementById('event-modal');
    this.addEventForm = document.getElementById('add-event-form');

    if (!this.calendarGrid) return;

    this.setupNavigation();
    this.setupModal();
    this.loadEvents();
  },

  setupNavigation() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
      });
    }
  },

  setupModal() {
    const addEventBtn = document.getElementById('add-event-btn');
    const cancelBtn = document.getElementById('cancel-event');

    if (addEventBtn && this.eventModal) {
      addEventBtn.addEventListener('click', () => {
        this.eventModal.classList.remove('hidden');
      });
    }

    if (cancelBtn && this.eventModal) {
      cancelBtn.addEventListener('click', () => {
        this.eventModal.classList.add('hidden');
      });
    }

    if (this.eventModal) {
      this.eventModal.addEventListener('click', (e) => {
        if (e.target === this.eventModal) {
          this.eventModal.classList.add('hidden');
        }
      });
    }

    if (this.addEventForm) {
      this.addEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addEvent();
      });
    }
  },

  async loadEvents() {
    try {
      const data = await App.apiFetch('/api/calendar');
      this.events = Array.isArray(data) ? data : [];
      this.renderCalendar();
    } catch (error) {
      console.error('Failed to load events:', error);
      this.events = [];
      this.renderCalendar();
    }
  },

  renderCalendar() {
    if (!this.calendarGrid || !this.currentMonthEl) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Update month label
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    this.currentMonthEl.textContent = `${monthNames[month]} ${year}`;

    // Clear grid
    this.calendarGrid.innerHTML = '';

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
      const headerEl = document.createElement('div');
      headerEl.className = 'calendar-day-header';
      headerEl.textContent = day;
      this.calendarGrid.appendChild(headerEl);
    });

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day other-month';
      dayEl.textContent = daysInPrevMonth - i;
      this.calendarGrid.appendChild(dayEl);
    }

    // Current month days
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      dayEl.textContent = day;

      if (isCurrentMonth && day === today.getDate()) {
        dayEl.classList.add('today');
      }

      // Check for events on this day
      const dateStr = this.formatDateStr(year, month, day);
      const hasEvent = this.events.some(e => e.date === dateStr);
      if (hasEvent) {
        dayEl.classList.add('has-event');
      }

      dayEl.addEventListener('click', () => {
        this.showDayEvents(dateStr);
      });

      this.calendarGrid.appendChild(dayEl);
    }

    // Next month days
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainingCells; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day other-month';
      dayEl.textContent = day;
      this.calendarGrid.appendChild(dayEl);
    }
  },

  formatDateStr(year, month, day) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  },

  showDayEvents(dateStr) {
    const dayEvents = this.events.filter(e => e.date === dateStr);
    if (dayEvents.length === 0) return;

    const eventNames = dayEvents.map(e => `${e.title} ${e.time || ''}`).join('\n');
    alert(`Events on ${dateStr}:\n${eventNames}`);
  },

  async addEvent() {
    const titleInput = document.getElementById('event-title');
    const dateInput = document.getElementById('event-date');
    const timeInput = document.getElementById('event-time');
    const descInput = document.getElementById('event-description');

    const title = titleInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value.trim();
    const description = descInput.value.trim();

    if (!title || !date) return;

    try {
      await App.apiFetch('/api/calendar', {
        method: 'POST',
        body: JSON.stringify({ title, date, time, description })
      });

      // Clear and close modal
      titleInput.value = '';
      dateInput.value = '';
      timeInput.value = '';
      descInput.value = '';
      this.eventModal.classList.add('hidden');

      // Reload events
      this.loadEvents();
    } catch (error) {
      console.error('Failed to add event:', error);
      App.showToast('Failed to add event', 'error');
    }
  }
};
