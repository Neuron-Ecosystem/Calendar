// Neuron Calendar - Умный планировщик
class NeuronCalendar {
    constructor() {
        this.currentDate = new Date();
        this.events = this.loadEvents();
        this.currentView = 'month'; // month, week, day
        this.selectedEvent = null;
        
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.updateEventsSidebar();
    }

    // Инициализация календаря
    render() {
        this.updateCurrentMonth();
        this.renderMonthView();
        this.setupEventForm();
    }

    // Обновление отображаемого месяца
    updateCurrentMonth() {
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        
        const year = this.currentDate.getFullYear();
        const month = monthNames[this.currentDate.getMonth()];
        
        document.getElementById('currentMonth').textContent = `${month} ${year}`;
        
        // Установка сегодняшней даты в форме
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('eventDate').value = today;
    }

    // Рендер месячного вида
    renderMonthView() {
        const grid = document.getElementById('monthGrid');
        grid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Первый день месяца
        const firstDay = new Date(year, month, 1);
        // Последний день месяца
        const lastDay = new Date(year, month + 1, 0);
        // День недели первого дня (0 - воскресенье, 1 - понедельник)
        const firstDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

        // Дни предыдущего месяца
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const date = new Date(year, month - 1, day);
            this.createDayElement(date, true, grid);
        }

        // Дни текущего месяца
        const daysInMonth = lastDay.getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            this.createDayElement(date, false, grid);
        }

        // Дни следующего месяца
        const totalCells = 42; // 6 недель
        const cellsFilled = firstDayIndex + daysInMonth;
        const nextMonthDays = totalCells - cellsFilled;
        for (let i = 1; i <= nextMonthDays; i++) {
            const date = new Date(year, month + 1, i);
            this.createDayElement(date, true, grid);
        }
    }

    // Создание элемента дня
    createDayElement(date, isOtherMonth, container) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        if (this.isToday(date)) {
            dayElement.classList.add('today');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);

        // Добавление событий дня
        const dayEvents = this.getEventsForDate(date);
        if (dayEvents.length > 0) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'day-events';
            
            dayEvents.slice(0, 3).forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event-preview';
                eventElement.textContent = event.title;
                eventElement.style.background = event.color;
                eventElement.onclick = (e) => {
                    e.stopPropagation();
                    this.showEventDetails(event);
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
            document.getElementById('eventDate').value = date.toISOString().split('T')[0];
        };

        container.appendChild(dayElement);
    }

    // Проверка является ли дата сегодняшним днем
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    // Получение событий для даты
    getEventsForDate(date) {
        const dateString = date.toISOString().split('T')[0];
        return this.events.filter(event => event.date === dateString);
    }

    // Смена месяца
    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderMonthView();
        this.updateCurrentMonth();
        this.updateEventsSidebar();
    }

    // Переход на сегодня
    goToToday() {
        this.currentDate = new Date();
        this.renderMonthView();
        this.updateCurrentMonth();
        this.updateEventsSidebar();
    }

    // Выбор даты
    selectDate(date) {
        // Снимаем выделение со всех дней
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        // Добавляем выделение выбранному дню
        const dayElements = document.querySelectorAll('.calendar-day');
        const selectedDay = Array.from(dayElements).find(day => {
            const dayNumber = day.querySelector('.day-number');
            return dayNumber && parseInt(dayNumber.textContent) === date.getDate() &&
                   !day.classList.contains('other-month');
        });
        
        if (selectedDay) {
            selectedDay.classList.add('selected');
        }
    }

    // Настройка формы события
    setupEventForm() {
        const form = document.getElementById('eventForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.saveEvent();
        };
    }

    // Сохранение события
    saveEvent() {
        const form = document.getElementById('eventForm');
        const formData = new FormData(form);
        
        const event = {
            id: Date.now().toString(),
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            startTime: document.getElementById('eventStartTime').value,
            endTime: document.getElementById('eventEndTime').value,
            description: document.getElementById('eventDescription').value,
            color: document.querySelector('input[name="eventColor"]:checked').value,
            createdAt: new Date().toISOString()
        };

        this.events.push(event);
        this.saveEvents();
        this.renderMonthView();
        this.updateEventsSidebar();
        this.hideAddEventModal();
        form.reset();
        
        // Установка сегодняшней даты по умолчанию
        document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    }

    // Показать детали события
    showEventDetails(event) {
        this.selectedEvent = event;
        
        document.getElementById('eventDetailsTitle').textContent = event.title;
        document.getElementById('eventDetailsDate').textContent = this.formatDate(event.date);
        
        let timeText = 'Весь день';
        if (event.startTime && event.endTime) {
            timeText = `${event.startTime} - ${event.endTime}`;
        } else if (event.startTime) {
            timeText = `С ${event.startTime}`;
        }
        document.getElementById('eventDetailsTime').textContent = timeText;
        
        document.getElementById('eventDetailsDescription').textContent = 
            event.description || 'Нет описания';
        
        this.showEventDetailsModal();
    }

    // Удаление события
    deleteEvent() {
        if (this.selectedEvent) {
            this.events = this.events.filter(e => e.id !== this.selectedEvent.id);
            this.saveEvents();
            this.renderMonthView();
            this.updateEventsSidebar();
            this.hideEventDetailsModal();
        }
    }

    // Форматирование даты
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            weekday: 'long'
        };
        return date.toLocaleDateString('ru-RU', options);
    }

    // Обновление сайдбара событий
    updateEventsSidebar() {
        const eventsList = document.getElementById('eventsList');
        const eventsCount = document.getElementById('eventsCount');
        
        const today = new Date().toISOString().split('T')[0];
        const todayEvents = this.getEventsForDate(new Date(today));
        
        eventsCount.textContent = `${todayEvents.length} событий`;
        
        if (todayEvents.length === 0) {
            eventsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <p>Нет событий на сегодня</p>
                    <button class="btn btn-outline" onclick="showAddEventModal()">Добавить первое событие</button>
                </div>
            `;
        } else {
            eventsList.innerHTML = todayEvents.map(event => `
                <div class="event-card" onclick="calendar.showEventDetails(${JSON.stringify(event).replace(/"/g, '&quot;')})">
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">
                        ${event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : 'Весь день'}
                    </div>
                    ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                </div>
            `).join('');
        }
    }

    // Переключение вида
    toggleView() {
        const views = ['month', 'week', 'day'];
        const currentIndex = views.indexOf(this.currentView);
        const nextIndex = (currentIndex + 1) % views.length;
        this.currentView = views[nextIndex];
        
        // Обновление UI
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(`${this.currentView}View`).classList.add('active');
        
        const toggleBtn = document.getElementById('viewToggle');
        const viewNames = { month: 'Месяц', week: 'Неделя', day: 'День' };
        toggleBtn.textContent = viewNames[this.currentView];
    }

    // Сохранение событий в localStorage
    saveEvents() {
        localStorage.setItem('neuronCalendar_events', JSON.stringify(this.events));
    }

    // Загрузка событий из localStorage
    loadEvents() {
        try {
            const saved = localStorage.getItem('neuronCalendar_events');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Глобальные функции для HTML
        window.calendar = this;
    }
}

// Глобальные функции для модальных окон
function showAddEventModal() {
    document.getElementById('addEventModal').classList.add('active');
}

function hideAddEventModal() {
    document.getElementById('addEventModal').classList.remove('active');
}

function showEventDetailsModal() {
    document.getElementById('eventDetailsModal').classList.add('active');
}

function hideEventDetailsModal() {
    document.getElementById('eventDetailsModal').classList.remove('active');
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

// Инициализация календаря при загрузке
let calendar;
document.addEventListener('DOMContentLoaded', () => {
    calendar = new NeuronCalendar();
});
