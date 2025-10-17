// Neuron Calendar - Умный планировщик
class NeuronCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.events = this.loadEvents();
        this.currentView = 'month';
        this.selectedEvent = null;
        this.sidebarView = 'today';
        
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.updateEventsSidebar();
    }

    render() {
        this.updateCurrentMonth();
        this.renderMonthView();
        this.setupEventForm();
    }

    updateCurrentMonth() {
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        
        const year = this.currentDate.getFullYear();
        const month = monthNames[this.currentDate.getMonth()];
        
        document.getElementById('currentMonth').textContent = `${month} ${year}`;
        
        // Устанавливаем выбранную дату в форме, а не сегодняшнюю
        document.getElementById('eventDate').value = this.selectedDate.toISOString().split('T')[0];
    }

    renderMonthView() {
        const grid = document.getElementById('monthGrid');
        grid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const date = new Date(year, month - 1, day);
            this.createDayElement(date, true, grid);
        }

        const daysInMonth = lastDay.getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            this.createDayElement(date, false, grid);
        }

        const totalCells = 42;
        const cellsFilled = firstDayIndex + daysInMonth;
        const nextMonthDays = totalCells - cellsFilled;
        for (let i = 1; i <= nextMonthDays; i++) {
            const date = new Date(year, month + 1, i);
            this.createDayElement(date, true, grid);
        }

        this.updateSelection();
    }

    createDayElement(date, isOtherMonth, container) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        if (this.isToday(date)) {
            dayElement.classList.add('today');
        }

        if (this.isSelectedDate(date)) {
            dayElement.classList.add('selected');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);

        const dayEvents = this.getEventsForDate(date);
        if (dayEvents.length > 0 && !isOtherMonth) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'day-events';
            
            dayEvents.slice(0, 3).forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event-preview';
                eventElement.textContent = event.title;
                eventElement.style.background = event.color;
                eventElement.onclick = (e) => {
                    e.stopPropagation();
                    this.showEventContextMenu(e, event);
                };
                eventsContainer.appendChild(eventElement);
            });
            
            if (dayEvents.length > 3) {
                const moreElement = document.createElement('div');
                moreElement.className = 'event-preview';
                moreElement.textContent = `+${dayEvents.length - 3} еще`;
                moreElement.style.background = 'var(--text-muted)';
                eventsContainer.appendChild(moreElement);
            }
            
            dayElement.appendChild(eventsContainer);
        }

        dayElement.onclick = () => {
            this.selectDate(date);
            // Обновляем дату в форме при выборе дня
            document.getElementById('eventDate').value = date.toISOString().split('T')[0];
        };

        dayElement.oncontextmenu = (e) => {
            e.preventDefault();
            if (!isOtherMonth && dayEvents.length > 0) {
                this.showDayContextMenu(e, date);
            }
        };

        container.appendChild(dayElement);
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    isSelectedDate(date) {
        return date.getDate() === this.selectedDate.getDate() &&
               date.getMonth() === this.selectedDate.getMonth() &&
               date.getFullYear() === this.selectedDate.getFullYear();
    }

    getEventsForDate(date) {
        const dateString = date.toISOString().split('T')[0];
        return this.events.filter(event => event.date === dateString);
    }

    getEventsForWeek() {
        const startDate = new Date(this.selectedDate);
        startDate.setDate(startDate.getDate() - 3);
        
        const endDate = new Date(this.selectedDate);
        endDate.setDate(endDate.getDate() + 3);
        
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= startDate && eventDate <= endDate;
        });
    }

    getEventsForDay(date = this.selectedDate) {
        const dateString = date.toISOString().split('T')[0];
        return this.events.filter(event => event.date === dateString);
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderMonthView();
        this.updateCurrentMonth();
        this.updateEventsSidebar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.renderMonthView();
        this.updateCurrentMonth();
        this.updateEventsSidebar();
        
        if (this.currentView === 'week') {
            this.renderWeekView();
        } else if (this.currentView === 'day') {
            this.renderDayView();
        }
    }

    selectDate(date) {
        this.selectedDate = date;
        this.renderMonthView();
        this.updateEventsSidebar();
        
        if (this.currentView === 'week') {
            this.renderWeekView();
        } else if (this.currentView === 'day') {
            this.renderDayView();
        }
    }

    updateSelection() {
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        const dayElements = document.querySelectorAll('.calendar-day');
        const selectedDay = Array.from(dayElements).find(day => {
            const dayNumber = day.querySelector('.day-number');
            return dayNumber && parseInt(dayNumber.textContent) === this.selectedDate.getDate() &&
                   !day.classList.contains('other-month') &&
                   this.currentDate.getMonth() === this.selectedDate.getMonth() &&
                   this.currentDate.getFullYear() === this.selectedDate.getFullYear();
        });
        
        if (selectedDay) {
            selectedDay.classList.add('selected');
        }
    }

    setupEventForm() {
        const form = document.getElementById('eventForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.saveEvent();
        };
    }

    saveEvent() {
        const eventId = document.getElementById('eventId').value;
        const formData = new FormData(document.getElementById('eventForm'));
        
        const event = {
            id: eventId || Date.now().toString(),
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            startTime: document.getElementById('eventStartTime').value,
            endTime: document.getElementById('eventEndTime').value,
            description: document.getElementById('eventDescription').value,
            location: document.getElementById('eventLocation').value,
            color: document.querySelector('input[name="eventColor"]:checked').value,
            createdAt: eventId ? this.events.find(e => e.id === eventId)?.createdAt || new Date().toISOString() : new Date().toISOString()
        };

        if (eventId) {
            const index = this.events.findIndex(e => e.id === eventId);
            if (index !== -1) {
                this.events[index] = event;
            }
        } else {
            this.events.push(event);
        }

        this.saveEvents();
        this.renderCurrentView();
        this.updateEventsSidebar();
        this.hideEventModal();
        document.getElementById('eventForm').reset();
        
        // После сохранения устанавливаем выбранную дату в форме
        document.getElementById('eventDate').value = this.selectedDate.toISOString().split('T')[0];
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'month':
                this.renderMonthView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'day':
                this.renderDayView();
                break;
        }
    }

    renderWeekView() {
        const daysContainer = document.getElementById('weekDaysContainer');
        const daysHeader = document.getElementById('weekDaysHeader');
        
        daysHeader.innerHTML = '<div class="week-day-header">Время</div>';
        daysContainer.innerHTML = '';

        const startDate = new Date(this.selectedDate);
        startDate.setDate(startDate.getDate() - 3);
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'week-day-header';
            if (this.isToday(currentDate)) {
                dayHeader.classList.add('today');
            }
            
            const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
            const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
            
            dayHeader.innerHTML = `
                <div>${dayNames[currentDate.getDay()]}</div>
                <div style="font-size: 1.2em; font-weight: bold;">${currentDate.getDate()}</div>
                <div>${monthNames[currentDate.getMonth()]}</div>
            `;
            daysHeader.appendChild(dayHeader);

            const dayColumn = document.createElement('div');
            dayColumn.className = 'week-day-column';
            dayColumn.onclick = () => {
                this.selectDate(currentDate);
                // Обновляем дату в форме при выборе дня в недельном виде
                document.getElementById('eventDate').value = currentDate.toISOString().split('T')[0];
            };

            for (let hour = 0; hour < 24; hour++) {
                const hourSlot = document.createElement('div');
                hourSlot.className = 'week-hour-slot';
                hourSlot.onclick = () => {
                    this.selectDate(currentDate);
                    this.showAddEventModal();
                    document.getElementById('eventDate').value = currentDate.toISOString().split('T')[0];
                    document.getElementById('eventStartTime').value = `${hour.toString().padStart(2, '0')}:00`;
                    document.getElementById('eventEndTime').value = `${(hour + 1).toString().padStart(2, '0')}:00`;
                };
                dayColumn.appendChild(hourSlot);
            }

            const dayEvents = this.getEventsForDate(currentDate);
            dayEvents.forEach(event => {
                if (event.startTime) {
                    const [hours, minutes] = event.startTime.split(':').map(Number);
                    const startPosition = hours * 60 + minutes;
                    const duration = event.endTime ? 
                        (new Date(`2000-01-01 ${event.endTime}`) - new Date(`2000-01-01 ${event.startTime}`)) / (1000 * 60) : 60;
                    
                    const eventElement = document.createElement('div');
                    eventElement.className = 'week-event';
                    eventElement.textContent = event.title;
                    eventElement.style.background = event.color;
                    eventElement.style.top = `${(startPosition / 60) * 60}px`;
                    eventElement.style.height = `${Math.max(duration / 60 * 60, 30)}px`;
                    eventElement.onclick = (e) => {
                        e.stopPropagation();
                        this.showEventContextMenu(e, event);
                    };
                    dayColumn.appendChild(eventElement);
                }
            });

            daysContainer.appendChild(dayColumn);
        }
    }

    renderDayView() {
        const dayTitle = document.getElementById('dayTitle');
        const dayTimeline = document.getElementById('dayTimeline');
        
        const options = { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            weekday: 'long'
        };
        dayTitle.textContent = this.selectedDate.toLocaleDateString('ru-RU', options);
        
        dayTimeline.innerHTML = '';

        const dayEvents = this.getEventsForDay();

        for (let hour = 0; hour < 24; hour++) {
            const hourSlot = document.createElement('div');
            hourSlot.className = 'hour-slot';
            
            const hourLabel = document.createElement('div');
            hourLabel.className = 'hour-label';
            hourLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
            hourSlot.appendChild(hourLabel);
            
            const hourContent = document.createElement('div');
            hourContent.className = 'hour-content';
            hourContent.onclick = () => {
                this.showAddEventModal();
                document.getElementById('eventDate').value = this.selectedDate.toISOString().split('T')[0];
                document.getElementById('eventStartTime').value = `${hour.toString().padStart(2, '0')}:00`;
                document.getElementById('eventEndTime').value = `${(hour + 1).toString().padStart(2, '0')}:00`;
            };
            hourSlot.appendChild(hourContent);

            const hourEvents = dayEvents.filter(event => {
                if (event.startTime) {
                    const eventHour = parseInt(event.startTime.split(':')[0]);
                    return eventHour === hour;
                }
                return false;
            });

            hourEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'day-event';
                eventElement.textContent = `${event.startTime} - ${event.title}`;
                eventElement.style.background = event.color;
                eventElement.onclick = (e) => {
                    e.stopPropagation();
                    this.showEventContextMenu(e, event);
                };
                hourContent.appendChild(eventElement);
            });

            dayTimeline.appendChild(hourSlot);
        }
    }

    showEventContextMenu(e, event) {
        e.preventDefault();
        e.stopPropagation();
        
        this.selectedEvent = event;
        const contextMenu = document.getElementById('contextMenu');
        
        // Очищаем и создаем новые пункты меню
        contextMenu.innerHTML = `
            <div class="context-item" onclick="editSelectedEvent()">✏️ Редактировать</div>
            <div class="context-item" onclick="deleteSelectedEvent()">🗑️ Удалить</div>
        `;
        
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
        contextMenu.classList.add('active');
        
        document.querySelectorAll('.event-card').forEach(card => {
            card.classList.remove('context-menu-active');
        });
        
        if (e.target.closest('.event-card')) {
            e.target.closest('.event-card').classList.add('context-menu-active');
        }

        const hideContextMenu = () => {
            contextMenu.classList.remove('active');
            document.removeEventListener('click', hideContextMenu);
            document.querySelectorAll('.event-card').forEach(card => {
                card.classList.remove('context-menu-active');
            });
        };

        setTimeout(() => {
            document.addEventListener('click', hideContextMenu);
        }, 100);
    }

    showDayContextMenu(e, date) {
        e.preventDefault();
        const contextMenu = document.getElementById('contextMenu');
        
        contextMenu.innerHTML = `
            <div class="context-item" onclick="showAddEventModal(); document.getElementById('eventDate').value = '${date.toISOString().split('T')[0]}'">➕ Добавить событие</div>
            <div class="context-item" onclick="calendar.selectDate(new Date('${date.toISOString()}')); calendar.updateEventsSidebar()">📅 Показать события</div>
        `;
        
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
        contextMenu.classList.add('active');

        const hideContextMenu = () => {
            contextMenu.classList.remove('active');
            document.removeEventListener('click', hideContextMenu);
        };

        setTimeout(() => {
            document.addEventListener('click', hideContextMenu);
        }, 100);
    }

    editEvent(event) {
        this.selectedEvent = event;
        document.getElementById('modalTitle').textContent = '✏️ Редактировать событие';
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventStartTime').value = event.startTime || '';
        document.getElementById('eventEndTime').value = event.endTime || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventLocation').value = event.location || '';
        
        const colorRadio = document.querySelector(`input[name="eventColor"][value="${event.color}"]`);
        if (colorRadio) {
            colorRadio.checked = true;
        }
        
        document.getElementById('deleteBtn').style.display = 'block';
        this.showEventModal();
    }

    deleteEvent() {
        if (this.selectedEvent) {
            this.events = this.events.filter(e => e.id !== this.selectedEvent.id);
            this.saveEvents();
            this.renderCurrentView();
            this.updateEventsSidebar();
            this.hideEventModal();
        }
    }

    updateEventsSidebar() {
        const eventsList = document.getElementById('eventsList');
        const eventsCount = document.getElementById('eventsCount');
        
        let filteredEvents = [];
        let title = '';

        if (this.sidebarView === 'today') {
            const today = new Date().toISOString().split('T')[0];
            filteredEvents = this.getEventsForDate(new Date(today));
            title = 'Сегодня';
        } else {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            
            filteredEvents = this.events.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate >= today && eventDate <= nextWeek;
            }).sort((a, b) => new Date(a.date) - new Date(b.date));
            
            title = 'Предстоящие';
        }

        eventsCount.textContent = `${filteredEvents.length} событий`;
        
        if (filteredEvents.length === 0) {
            eventsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <p>Нет событий ${this.sidebarView === 'today' ? 'на сегодня' : 'на ближайшую неделю'}</p>
                    <button class="btn btn-outline" onclick="showAddEventModal()">Добавить событие</button>
                </div>
            `;
        } else {
            eventsList.innerHTML = filteredEvents.map(event => `
                <div class="event-card" oncontextmenu="calendar.showEventContextMenu(event, ${JSON.stringify(event).replace(/"/g, '&quot;')})" onclick="calendar.showEventContextMenu(event, ${JSON.stringify(event).replace(/"/g, '&quot;')})">
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">
                        ${event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : 'Весь день'}
                    </div>
                    ${event.location ? `<div class="event-location">📍 ${event.location}</div>` : ''}
                    ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                </div>
            `).join('');
        }

        document.querySelector('.sidebar-header h3').textContent = `📋 События (${title})`;
    }

    toggleView() {
        const views = ['month', 'week', 'day'];
        const currentIndex = views.indexOf(this.currentView);
        const nextIndex = (currentIndex + 1) % views.length;
        this.currentView = views[nextIndex];
        
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(`${this.currentView}View`).classList.add('active');
        
        const toggleBtn = document.getElementById('viewToggle');
        const viewNames = { month: 'Месяц', week: 'Неделя', day: 'День' };
        toggleBtn.textContent = viewNames[this.currentView];

        this.renderCurrentView();
    }

    saveEvents() {
        localStorage.setItem('neuronCalendar_events', JSON.stringify(this.events));
    }

    loadEvents() {
        try {
            const saved = localStorage.getItem('neuronCalendar_events');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    setupEventListeners() {
        window.calendar = this;

        document.querySelectorAll('.view-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.view-option').forEach(opt => opt.classList.remove('active'));
                e.target.classList.add('active');
                this.sidebarView = e.target.dataset.view;
                this.updateEventsSidebar();
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                document.getElementById('contextMenu').classList.remove('active');
            }
        });
    }
}

function showAddEventModal() {
    document.getElementById('modalTitle').textContent = '➕ Создать событие';
    document.getElementById('eventId').value = '';
    document.getElementById('eventForm').reset();
    document.getElementById('deleteBtn').style.display = 'none';
    
    // Устанавливаем выбранную дату в форме, а не сегодняшнюю
    document.getElementById('eventDate').value = calendar.selectedDate.toISOString().split('T')[0];
    
    document.getElementById('eventModal').classList.add('active');
}

function showEventModal() {
    document.getElementById('eventModal').classList.add('active');
}

function hideEventModal() {
    document.getElementById('eventModal').classList.remove('active');
    document.getElementById('eventForm').reset();
    document.getElementById('deleteBtn').style.display = 'none';
}

function editSelectedEvent() {
    if (calendar.selectedEvent) {
        calendar.editEvent(calendar.selectedEvent);
    }
}

function deleteSelectedEvent() {
    if (calendar.selectedEvent && confirm('Вы уверены, что хотите удалить это событие?')) {
        calendar.deleteEvent();
    }
}

function changeMonth(direction) {
    calendar.changeMonth(direction);
}

function goToToday() {
    calendar.goToToday();
}

function toggleView() {
    calendar.toggleView();
}

let calendar;
document.addEventListener('DOMContentLoaded', () => {
    calendar = new NeuronCalendar();
});
