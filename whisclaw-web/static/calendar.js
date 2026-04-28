/**
 * WhisClawCalendar - Calendar panel functionality
 */
class WhisClawCalendar {
    static calendarGrid = null;
    static calendarTitle = null;
    static eventForm = null;
    static eventDate = null;
    static eventTitle = null;

    static currentDate = new Date();
    static currentYear = null;
    static currentMonth = null;
    static events = [];
    static selectedDate = null;

    static MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    static DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    /**
     * Initialize calendar panel
     */
    static init() {
        this.calendarGrid = document.getElementById('calendar-grid');
        this.calendarTitle = document.getElementById('calendar-title');
        this.eventForm = document.getElementById('event-form');
        this.eventDate = document.getElementById('event-date');
        this.eventTitle = document.getElementById('event-title');

        if (!this.calendarGrid || !this.calendarTitle || !this.eventForm) {
            console.error('Calendar elements not found');
            return;
        }

        // Navigation buttons
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevMonth());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextMonth());
        }

        this.eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.add();
        });

        // Set default date to today
        if (this.eventDate) {
            this.eventDate.valueAsDate = new Date();
        }

        // Initialize current month
        this.currentYear = this.currentDate.getFullYear();
        this.currentMonth = this.currentDate.getMonth();

        // Load events
        this.load();
    }

    /**
     * Load events from server
     */
    static async load() {
        try {
            const response = await fetch('/api/calendar');
            if (response.ok) {
                const data = await response.json();
                this.events = data.events || [];
                this.renderCalendar();
            }
        } catch (error) {
            console.error('Failed to load events:', error);
            this.events = [];
            this.renderCalendar();
        }
    }

    /**
     * Render the calendar grid
     */
    static renderCalendar() {
        if (!this.calendarGrid || !this.calendarTitle) return;

        // Update title
        this.calendarTitle.textContent = `${this.MONTH_NAMES[this.currentMonth]} ${this.currentYear}`;

        // Get first day of month and total days
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startingDay = firstDay.getDay();
        const totalDays = lastDay.getDate();

        // Get previous month days
        const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();

        // Build HTML
        let html = '';

        // Day headers
        this.DAY_NAMES.forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });

        // Previous month days
        for (let i = startingDay - 1; i >= 0; i--) {
            html += `<div class="calendar-day other-month">${prevMonthLastDay - i}</div>`;
        }

        // Current month days
        const today = new Date();
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = this.formatDateStr(this.currentYear, this.currentMonth, day);
            const isToday = this.currentYear === today.getFullYear() &&
                           this.currentMonth === today.getMonth() &&
                           day === today.getDate();
            const hasEvent = this.events.some(e => e.date === dateStr);
            const isSelected = this.selectedDate === dateStr;

            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (hasEvent) classes += ' has-event';
            if (isSelected) classes += ' selected';

            html += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
        }

        // Next month days
        const remainingCells = 42 - (startingDay + totalDays);
        for (let i = 1; i <= remainingCells; i++) {
            html += `<div class="calendar-day other-month">${i}</div>`;
        }

        this.calendarGrid.innerHTML = html;

        // Add click handlers to day cells
        this.calendarGrid.querySelectorAll('.calendar-day:not(.other-month)').forEach(cell => {
            cell.addEventListener('click', () => {
                const date = cell.dataset.date;
                this.selectDate(date);
            });
        });
    }

    /**
     * Format date as YYYY-MM-DD
     */
    static formatDateStr(year, month, day) {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    /**
     * Select a date
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     */
    static selectDate(dateStr) {
        this.selectedDate = dateStr;

        // Update selected state
        this.calendarGrid.querySelectorAll('.calendar-day').forEach(cell => {
            cell.classList.toggle('selected', cell.dataset.date === dateStr);
        });

        // Set date in form
        if (this.eventDate) {
            const [year, month, day] = dateStr.split('-').map(Number);
            this.eventDate.valueAsDate = new Date(year, month - 1, day);
        }
    }

    /**
     * Go to previous month
     */
    static prevMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.selectedDate = null;
        this.renderCalendar();
    }

    /**
     * Go to next month
     */
    static nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.selectedDate = null;
        this.renderCalendar();
    }

    /**
     * Add new event
     */
    static async add() {
        const date = this.eventDate?.value;
        const title = this.eventTitle?.value?.trim();

        if (!date || !title) {
            this.showError('Date and title are required');
            return;
        }

        try {
            const response = await fetch('/api/calendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ date, title })
            });

            if (response.ok) {
                // Clear form
                if (this.eventTitle) this.eventTitle.value = '';

                this.showSuccess('Event added');
                // Reload events
                this.load();
            } else {
                const error = await response.json();
                this.showError('Failed to add event: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to add event:', error);
            this.showError('Failed to add event');
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
