// Neuron Calendar - Умный планировщик
class NeuronCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.events = this.loadEvents();
        this.currentView = 'month';
        this.selectedEvent = null;
        this.sidebarView = 'today';
        this.isMobile = this.checkMobile();
        
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.updateEventsSidebar();
        this.adjustForMobile();
    }

    checkMobile() {
        return window.innerWidth <= 768;
    }

    adjustForMobile() {
        if (this.isMobile) {
            document.body.classList.add('mobile');
            // На мобильных устройствах по умолчанию показываем день
            this.currentView = 'month';
            this.toggleView();
        }
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
        
        // Устанавливаем выбранную дату в форме
        document.getElementById('eventDate').value = this.formatDateForInput(this.selectedDate);
    }

    // Форматирование даты для input[type="date"]
    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Преобразование строки даты в объект Date (исправление часового пояса)
    parseDateString(dateString) {
        const parts = dateString.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // месяцы от 0 до 11
        const day = parseInt(parts[2]);
        return new Date(year, month, day);
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
            
            dayEvents.slice(0, 2).forEach(event => { // Показываем только 2 события на мобильных
                const eventElement = document.createElement('div');
                eventElement.className = 'event-preview';
                eventElement.textContent = event.title;
                eventElement.style.background = event.color;
                eventElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showEventContextMenu(e, event);
                });
                eventElement.addEventListener('touchstart', (e) => {
                    if (this.isMobile) {
                        e.preventDefault();
                        this.showEventContextMenu(e, event);
                    }
                });
                eventsContainer.appendChild(eventElement);
            });
            
            if (dayEvents.length > 2) {
                const moreElement = document.createElement('div');
                moreElement.className = 'event-preview';
                moreElement.textContent = `+${dayEvents.length - 2}`;
                moreElement.style.background = 'var(--text-muted)';
                eventsContainer.appendChild(moreElement);
            }
            
            dayElement.appendChild(eventsContainer);
        }

        // Обработчики для мобильных и десктопных устройств
        dayElement.addEventListener('click', () => {
            this.selectDate(date);
            document.getElementById('eventDate').value = this.formatDateForInput(date);
        });

        dayElement.addEventListener('touchstart', (e) => {
            if (this.isMobile) {
                e.preventDefault();
                this.selectDate(date);
                document.getElementById('eventDate').value = this.formatDateForInput(date);
            }
        });

        // Контекстное меню для долгого нажатия на мобильных
        let touchTimer;
        dayElement.addEventListener('touchstart', (e) => {
            if (this.isMobile && !isOtherMonth && this.getEventsForDate(date).length > 0) {
                touchTimer = setTimeout(() => {
                    this.showDayContextMenu(e, date);
                }, 500);
            }
        });

        dayElement.addEventListener('touchend', () => {
            clearTimeout(touchTimer);
        });

        dayElement.addEventListener('touchmove', () => {
            clearTimeout(touchTimer);
        });

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
        const dateString = this.formatDateForInput(date);
        return this.events.filter(event => event.date === dateString);
    }

    getEventsForWeek() {
        const startDate = new Date(this.selectedDate);
        startDate.setDate(startDate.getDate() - 3);
        
        const endDate = new Date(this.selectedDate);
        endDate.setDate(endDate.getDate() + 3);
        
        return this.events.filter(event => {
            const eventDate = this.parseDateString(event.date);
            return eventDate >= startDate && eventDate <= endDate;
        });
    }

    getEventsForDay(date = this.selectedDate) {
        const dateString = this.formatDateForInput(date);
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

        // Добавляем обработчик для кнопки удаления в форме
        document.getElementById('deleteBtn').onclick = () => {
            this.deleteEventFromModal();
        };
    }

    saveEvent() {
        const eventId = document.getElementById('eventId').value;
        
        // Получаем значения из формы
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

        // Проверяем обязательные поля
        if (!event.title.trim()) {
            this.showNotification('Введите название события', 'error');
            return;
        }

        if (!event.date) {
            this.showNotification('Выберите дату события', 'error');
            return;
        }

        if (eventId) {
            // Редактирование существующего события
            const index = this.events.findIndex(e => e.id === eventId);
            if (index !== -1) {
                this.events[index] = event;
            }
        } else {
            // Создание нового события
            this.events.push(event);
        }

        this.saveEvents();
        this.renderCurrentView();
        this.updateEventsSidebar();
        
        // Закрываем модальное окно и сбрасываем форму
        this.hideEventModal();
        
        // Показываем уведомление об успешном сохранении
        this.showNotification(eventId ? 'Событие обновлено!' : 'Событие создано!');
    }

    // Новый метод для удаления события из модального окна
    deleteEventFromModal() {
        const eventId = document.getElementById('eventId').value;
        if (eventId) {
            if (confirm('Вы уверены, что хотите удалить это событие?')) {
                this.events = this.events.filter(e => e.id !== eventId);
                this.saveEvents();
                this.renderCurrentView();
                this.updateEventsSidebar();
                this.hideEventModal();
                this.showNotification('Событие удалено!');
            }
        }
    }

    showNotification(message, type = 'success') {
        // Создаем временное уведомление
        const notification = document.createElement('div');
        const backgroundColor = type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: var(--shadow-lg);
            animation: slideIn 0.3s ease;
            font-weight: 600;
            max-width: 300px;
            word-wrap: break-word;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
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
        const timeColumn = document.querySelector('.time-column');
        
        daysHeader.innerHTML = '<div class="week-day-header">Время</div>';
        daysContainer.innerHTML = '';
        timeColumn.innerHTML = '';

        const startDate = new Date(this.selectedDate);
        startDate.setDate(startDate.getDate() - 3);
        
        // Генерируем временные слоты
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
            timeColumn.appendChild(timeSlot);
        }
        
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
                <div style="font-size: ${this.isMobile ? '1em' : '1.2em'}; font-weight: bold;">${currentDate.getDate()}</div>
                <div>${monthNames[currentDate.getMonth()]}</div>
            `;
            daysHeader.appendChild(dayHeader);

            const dayColumn = document.createElement('div');
            dayColumn.className = 'week-day-column';
            dayColumn.addEventListener('click', () => {
                this.selectDate(currentDate);
                document.getElementById('eventDate').value = this.formatDateForInput(currentDate);
            });

            for (let hour = 0; hour < 24; hour++) {
                const hourSlot = document.createElement('div');
                hourSlot.className = 'week-hour-slot';
                hourSlot.addEventListener('click', () => {
                    this.selectDate(currentDate);
                    this.showAddEventModal();
                    document.getElementById('eventDate').value = this.formatDateForInput(currentDate);
                    document.getElementById('eventStartTime').value = `${hour.toString().padStart(2, '0')}:00`;
                    document.getElementById('eventEndTime').value = `${(hour + 1).toString().padStart(2, '0')}:00`;
                });
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
                    eventElement.style.top = `${(startPosition / 60) * (this.isMobile ? 35 : 40)}px`;
                    eventElement.style.height = `${Math.max(duration / 60 * (this.isMobile ? 35 : 40), 25)}px`;
                    eventElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.showEventContextMenu(e, event);
                    });
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
            hourContent.addEventListener('click', () => {
                this.showAddEventModal();
                document.getElementById('eventDate').value = this.formatDateForInput(this.selectedDate);
                document.getElementById('eventStartTime').value = `${hour.toString().padStart(2, '0')}:00`;
                document.getElementById('eventEndTime').value = `${(hour + 1).toString().padStart(2, '0')}:00`;
            });
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
                eventElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showEventContextMenu(e, event);
                });
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
        contextMenu.innerHTML = '';
        
        const editItem = document.createElement('div');
        editItem.className = 'context-item';
        editItem.textContent = '✏️ Редактировать';
        editItem.addEventListener('click', () => {
            this.editEvent(event);
            contextMenu.classList.remove('active');
        });
        
        const deleteItem = document.createElement('div');
        deleteItem.className = 'context-item';
        deleteItem.textContent = '🗑️ Удалить';
        deleteItem.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите удалить это событие?')) {
                this.deleteEvent();
            }
            contextMenu.classList.remove('active');
        });
        
        contextMenu.appendChild(editItem);
        contextMenu.appendChild(deleteItem);
        
        // Позиционируем контекстное меню
        const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const y = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
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
            document.removeEventListener('touchstart', hideContextMenu);
            document.querySelectorAll('.event-card').forEach(card => {
                card.classList.remove('context-menu-active');
            });
        };

        setTimeout(() => {
            document.addEventListener('click', hideContextMenu);
            document.addEventListener('touchstart', hideContextMenu);
        }, 100);
    }

    showDayContextMenu(e, date) {
        e.preventDefault();
        const contextMenu = document.getElementById('contextMenu');
        
        contextMenu.innerHTML = '';
        
        const addItem = document.createElement('div');
        addItem.className = 'context-item';
        addItem.textContent = '➕ Добавить событие';
        addItem.addEventListener('click', () => {
            this.showAddEventModal();
            document.getElementById('eventDate').value = this.formatDateForInput(date);
            contextMenu.classList.remove('active');
        });
        
        const showItem = document.createElement('div');
        showItem.className = 'context-item';
        showItem.textContent = '📅 Показать события';
        showItem.addEventListener('click', () => {
            this.selectDate(date);
            this.updateEventsSidebar();
            contextMenu.classList.remove('active');
        });
        
        contextMenu.appendChild(addItem);
        contextMenu.appendChild(showItem);
        
        const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const y = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.classList.add('active');

        const hideContextMenu = () => {
            contextMenu.classList.remove('active');
            document.removeEventListener('click', hideContextMenu);
            document.removeEventListener('touchstart', hideContextMenu);
        };

        setTimeout(() => {
            document.addEventListener('click', hideContextMenu);
            document.addEventListener('touchstart', hideContextMenu);
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
        
        // Устанавливаем цвет события
        const colorRadios = document.querySelectorAll('input[name="eventColor"]');
        colorRadios.forEach(radio => {
            radio.checked = (radio.value === event.color);
        });
        
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
            this.showNotification('Событие удалено!');
        }
    }

    updateEventsSidebar() {
        const eventsList = document.getElementById('eventsList');
        const eventsCount = document.getElementById('eventsCount');
        
        let filteredEvents = [];
        let title = '';

        if (this.sidebarView === 'today') {
            const today = this.formatDateForInput(new Date());
            filteredEvents = this.events.filter(event => event.date === today);
            title = 'Сегодня';
        } else {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            
            filteredEvents = this.events.filter(event => {
                const eventDate = this.parseDateString(event.date);
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
            eventsList.innerHTML = filteredEvents.map(event => {
                const eventDate = this.parseDateString(event.date);
                const displayDate = eventDate.toLocaleDateString('ru-RU', { 
                    day: 'numeric', 
                    month: 'short'
                });
                
                return `
                <div class="event-card" oncontextmenu="calendar.showEventContextMenu(event, ${JSON.stringify(event).replace(/"/g, '&quot;')})" onclick="calendar.showEventContextMenu(event, ${JSON.stringify(event).replace(/"/g, '&quot;')})" ontouchstart="calendar.showEventContextMenu(event, ${JSON.stringify(event).replace(/"/g, '&quot;')})">
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">
                        ${event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : 'Весь день'}
                        ${this.sidebarView === 'upcoming' ? ` (${displayDate})` : ''}
                    </div>
                    ${event.location ? `<div class="event-location">📍 ${event.location}</div>` : ''}
                    ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                </div>
            `}).join('');
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

        // Обработчики для закрытия контекстного меню
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                document.getElementById('contextMenu').classList.remove('active');
            }
        });

        document.addEventListener('touchstart', (e) => {
            if (!e.target.closest('.context-menu')) {
                document.getElementById('contextMenu').classList.remove('active');
            }
        });

        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.isMobile = this.checkMobile();
            this.adjustForMobile();
        });
    }

    // Методы для работы с модальными окнами
    showAddEventModal() {
        document.getElementById('modalTitle').textContent = '➕ Создать событие';
        document.getElementById('eventId').value = '';
        document.getElementById('eventForm').reset();
        document.getElementById('deleteBtn').style.display = 'none';
        
        // Устанавливаем выбранную дату в форме
        document.getElementById('eventDate').value = this.formatDateForInput(this.selectedDate);
        
        document.getElementById('eventModal').classList.add('active');
    }

    showEventModal() {
        document.getElementById('eventModal').classList.add('active');
    }

    hideEventModal() {
        document.getElementById('eventModal').classList.remove('active');
        document.getElementById('eventForm').reset();
        document.getElementById('deleteBtn').style.display = 'none';
    }
}

// Глобальные функции
function showAddEventModal() {
    calendar.showAddEventModal();
}

function hideEventModal() {
    calendar.hideEventModal();
}

function deleteEventFromModal() {
    calendar.deleteEventFromModal();
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
