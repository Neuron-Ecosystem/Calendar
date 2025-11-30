// Neuron Calendar - Умный планировщик с Firebase синхронизацией
class NeuronCalendar {
    // Добавьте эти методы в класс NeuronCalendar

// Mobile Events Modal Methods
setupMobileEventsModal() {
    if (!this.isMobile) return;

    // Backdrop click to close
    document.getElementById('mobileEventsBackdrop').addEventListener('click', () => {
        this.hideMobileEvents();
    });

    // Swipe down to close
    this.setupMobileEventsSwipe();
}

setupMobileEventsSwipe() {
    const modal = document.getElementById('mobileEventsModal');
    let startY = 0;
    let currentY = 0;

    modal.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
    }, { passive: true });

    modal.addEventListener('touchmove', (e) => {
        if (startY === 0) return;
        
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        
        // Only allow swipe down
        if (diff > 0) {
            e.preventDefault();
            const translateY = Math.min(diff, 100);
            modal.querySelector('.mobile-events-content').style.transform = `translateY(${translateY}px)`;
        }
    }, { passive: false });

    modal.addEventListener('touchend', () => {
        if (startY === 0) return;

        const diff = currentY - startY;
        const threshold = 80; // Minimum swipe distance to close
        
        if (diff > threshold) {
            this.hideMobileEvents();
        } else {
            // Reset position
            modal.querySelector('.mobile-events-content').style.transform = 'translateY(0)';
        }
        
        startY = 0;
        currentY = 0;
    }, { passive: true });
}

showMobileEvents(date, events) {
    if (!this.isMobile) return;

    const modal = document.getElementById('mobileEventsModal');
    const dateElement = document.getElementById('mobileEventsDate');
    const eventsList = document.getElementById('mobileEventsList');

    // Format date
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    dateElement.textContent = date.toLocaleDateString('ru-RU', options);

    // Populate events
    if (events.length === 0) {
        eventsList.innerHTML = `
            <div class="mobile-events-empty">
                <div class="mobile-events-empty-icon">📅</div>
                <div class="mobile-events-empty-text">Нет событий на этот день</div>
                <button class="btn btn-primary" onclick="hideMobileEvents(); showAddEventModal();">
                    ➕ Добавить событие
                </button>
            </div>
        `;
    } else {
        eventsList.innerHTML = events.map(event => `
            <div class="mobile-event-card" 
                 onclick="calendar.handleMobileEventClick(event, ${JSON.stringify(event).replace(/"/g, '&quot;')})"
                 ontouchstart="this.style.transform='scale(0.98)'"
                 ontouchend="this.style.transform=''">
                <div class="mobile-event-title">${event.title}</div>
                ${event.startTime && event.endTime ? 
                    `<div class="mobile-event-time">🕒 ${event.startTime} - ${event.endTime}</div>` : 
                    '<div class="mobile-event-time">🕒 Весь день</div>'
                }
                ${event.location ? `<div class="mobile-event-location">📍 ${event.location}</div>` : ''}
                ${event.description ? `<div class="mobile-event-description">${event.description}</div>` : ''}
            </div>
        `).join('');
    }

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

hideMobileEvents() {
    const modal = document.getElementById('mobileEventsModal');
    
    modal.classList.add('closing');
    setTimeout(() => {
        modal.classList.remove('active', 'closing');
        modal.querySelector('.mobile-events-content').style.transform = '';
        document.body.style.overflow = ''; // Restore scrolling
    }, 300);
}

handleMobileEventClick(domEvent, event) {
    domEvent.stopPropagation();
    this.showEventContextMenu(domEvent, event);
    this.hideMobileEvents();
}

// Update mobile day element creation
createMobileDayElement(date, isOtherMonth, container) {
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

    const dayEvents = this.getEventsForDate(date);
    if (dayEvents.length > 0 && !isOtherMonth) {
        dayElement.classList.add('has-events');
        if (dayEvents.length > 1) {
            dayElement.classList.add('multiple-events');
        }
    }

    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayElement.appendChild(dayNumber);

    // Enhanced touch handling for mobile
    dayElement.addEventListener('click', () => {
        this.handleMobileDayTap(date);
    });

    // Remove old long press context menu for mobile
    // Keep only simple tap handling

    container.appendChild(dayElement);
}

handleMobileDayTap(date) {
    if (this.isMobile) {
        const dayEvents = this.getEventsForDate(date);
        this.selectedDate = date;
        this.showMobileEvents(date, dayEvents);
    } else {
        this.selectDate(date);
    }
}

// Update the existing init method
async init() {
    this.setupEventListeners();
    await this.setupAuthListener();
    this.adjustForMobile();
    
    if (this.isMobile) {
        this.setupMobileGestures();
        this.setupMobileNavigation();
        this.setupMobileEventHandlers();
        this.setupMobileEventsModal(); // Add this line
    }
}

// Update renderMonthView for mobile
renderMonthView() {
    if (this.isMobile) {
        this.createMobileMonthView();
    } else {
        // Original desktop month view logic
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
}

// Update desktop day element creation (keep dots for desktop)
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
        
        // Show event dots for desktop
        if (this.isMobile) {
            // For mobile, we use CSS indicators instead
            dayElement.classList.add('has-events');
            if (dayEvents.length > 1) {
                dayElement.classList.add('multiple-events');
            }
        } else {
            // For desktop, show event previews
            dayEvents.slice(0, 2).forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event-preview';
                eventElement.textContent = event.title;
                eventElement.style.background = event.color;
                eventElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showEventContextMenu(e, event);
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
    }

    dayElement.addEventListener('click', () => {
        if (this.isMobile) {
            this.handleMobileDayTap(date);
        } else {
            this.selectDate(date);
            document.getElementById('eventDate').value = this.formatDateForInput(date);
        }
    });

    container.appendChild(dayElement);
}
    // Добавьте эти методы в класс NeuronCalendar

// Mobile Optimization Methods
setupMobileGestures() {
    if (!this.isMobile) return;

    let touchStartX = 0;
    let touchStartY = 0;
    const minSwipeDistance = 50;

    const handleTouchStart = (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        if (!touchStartX || !touchStartY) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;

        // Only consider horizontal swipes with minimal vertical movement
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
            if (diffX > 0) {
                // Swipe left - next month/week/day
                this.handleSwipe('next');
            } else {
                // Swipe right - previous month/week/day
                this.handleSwipe('prev');
            }
        }

        touchStartX = 0;
        touchStartY = 0;
    };

    // Add event listeners to calendar views
    const views = ['monthView', 'weekView', 'dayView'];
    views.forEach(viewId => {
        const view = document.getElementById(viewId);
        if (view) {
            view.addEventListener('touchstart', handleTouchStart, { passive: true });
            view.addEventListener('touchend', handleTouchEnd, { passive: true });
        }
    });
}

handleSwipe(direction) {
    switch (this.currentView) {
        case 'month':
            this.changeMonth(direction === 'next' ? 1 : -1);
            break;
        case 'week':
            this.changeWeek(direction === 'next' ? 1 : -1);
            break;
        case 'day':
            this.changeDay(direction === 'next' ? 1 : -1);
            break;
    }
}

changeWeek(direction) {
    this.selectedDate.setDate(this.selectedDate.getDate() + (direction * 7));
    this.renderWeekView();
    this.updateEventsSidebar();
}

changeDay(direction) {
    this.selectedDate.setDate(this.selectedDate.getDate() + direction);
    this.renderDayView();
    this.updateEventsSidebar();
}

// Enhanced mobile rendering
createMobileMonthView() {
    const grid = document.getElementById('monthGrid');
    grid.innerHTML = '';

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // Previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = new Date(year, month - 1, day);
        this.createMobileDayElement(date, true, grid);
    }

    // Current month days
    const daysInMonth = lastDay.getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        this.createMobileDayElement(date, false, grid);
    }

    // Next month days
    const totalCells = 42;
    const cellsFilled = firstDayIndex + daysInMonth;
    const nextMonthDays = totalCells - cellsFilled;
    for (let i = 1; i <= nextMonthDays; i++) {
        const date = new Date(year, month + 1, i);
        this.createMobileDayElement(date, true, grid);
    }

    this.updateSelection();
}

createMobileDayElement(date, isOtherMonth, container) {
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

    // On mobile, show dot indicators instead of event titles
    const dayEvents = this.getEventsForDate(date);
    if (dayEvents.length > 0 && !isOtherMonth) {
        const eventsIndicator = document.createElement('div');
        eventsIndicator.className = 'mobile-events-indicator';
        
        // Show up to 3 dots for events
        const eventCount = Math.min(dayEvents.length, 3);
        for (let i = 0; i < eventCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'event-dot';
            dot.style.background = dayEvents[i].color;
            eventsIndicator.appendChild(dot);
        }
        
        if (dayEvents.length > 3) {
            const moreDot = document.createElement('div');
            moreDot.className = 'event-dot more-dots';
            moreDot.textContent = '+';
            moreDot.style.background = 'var(--text-muted)';
            eventsIndicator.appendChild(moreDot);
        }
        
        dayElement.appendChild(eventsIndicator);
    }

    // Enhanced touch handling for mobile
    dayElement.addEventListener('click', () => {
        this.handleDayTap(date);
    });

    // Long press for context menu
    let pressTimer;
    dayElement.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
            this.showMobileDayContextMenu(e, date, dayEvents);
        }, 500);
    });

    dayElement.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
    });

    dayElement.addEventListener('touchmove', () => {
        clearTimeout(pressTimer);
    });

    container.appendChild(dayElement);
}

handleDayTap(date) {
    if (this.isMobile) {
        // On mobile, tapping a day switches to day view
        this.selectedDate = date;
        this.currentView = 'day';
        this.updateView();
        this.renderDayView();
        this.updateEventsSidebar();
    } else {
        this.selectDate(date);
    }
}

showMobileDayContextMenu(e, date, events) {
    e.preventDefault();
    
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.innerHTML = '';
    
    const addEventItem = document.createElement('div');
    addEventItem.className = 'context-item';
    addEventItem.textContent = '➕ Добавить событие';
    addEventItem.addEventListener('click', () => {
        this.showAddEventModal();
        document.getElementById('eventDate').value = this.formatDateForInput(date);
        contextMenu.classList.remove('active');
    });
    
    contextMenu.appendChild(addEventItem);

    // Add quick event options if there are events
    if (events.length > 0) {
        const showEventsItem = document.createElement('div');
        showEventsItem.className = 'context-item';
        showEventsItem.textContent = `📅 Показать события (${events.length})`;
        showEventsItem.addEventListener('click', () => {
            this.selectDate(date);
            this.updateEventsSidebar();
            contextMenu.classList.remove('active');
        });
        contextMenu.appendChild(showEventsItem);
    }

    const goToDateItem = document.createElement('div');
    goToDateItem.className = 'context-item';
    goToDateItem.textContent = '📋 Перейти к дате';
    goToDateItem.addEventListener('click', () => {
        this.selectDate(date);
        contextMenu.classList.remove('active');
    });
    contextMenu.appendChild(goToDateItem);

    // Position context menu for mobile
    const rect = e.target.getBoundingClientRect();
    contextMenu.style.left = '50%';
    contextMenu.style.top = '50%';
    contextMenu.style.transform = 'translate(-50%, -50%)';
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

// Enhanced mobile modal handling
showAddEventModal() {
    document.getElementById('modalTitle').textContent = '➕ Создать событие';
    document.getElementById('eventId').value = '';
    document.getElementById('eventForm').reset();
    document.getElementById('deleteBtn').style.display = 'none';
    
    document.getElementById('eventDate').value = this.formatDateForInput(this.selectedDate);
    
    const modal = document.getElementById('eventModal');
    modal.classList.add('active');
    
    // Focus management for mobile
    if (this.isMobile) {
        setTimeout(() => {
            document.getElementById('eventTitle')?.focus();
        }, 300);
    }
}

// Mobile view switching
setupMobileNavigation() {
    if (!this.isMobile) return;

    // Create mobile bottom navigation
    this.createMobileBottomNav();
    
    // Handle view switching
    document.addEventListener('click', (e) => {
        if (e.target.closest('.mobile-nav-item')) {
            const view = e.target.closest('.mobile-nav-item').dataset.view;
            this.switchMobileView(view);
        }
    });
}

createMobileBottomNav() {
    const bottomNav = document.createElement('div');
    bottomNav.className = 'mobile-bottom-nav';
    bottomNav.innerHTML = `
        <button class="mobile-nav-item ${this.currentView === 'month' ? 'active' : ''}" data-view="month">
            <div class="mobile-nav-icon">📅</div>
            <span>Месяц</span>
        </button>
        <button class="mobile-nav-item ${this.currentView === 'week' ? 'active' : ''}" data-view="week">
            <div class="mobile-nav-icon">📆</div>
            <span>Неделя</span>
        </button>
        <button class="mobile-nav-item ${this.currentView === 'day' ? 'active' : ''}" data-view="day">
            <div class="mobile-nav-icon">📝</div>
            <span>День</span>
        </button>
        <button class="mobile-nav-item" onclick="showAddEventModal()">
            <div class="mobile-nav-icon">➕</div>
            <span>Создать</span>
        </button>
    `;
    
    document.querySelector('.calendar-container').appendChild(bottomNav);
}

switchMobileView(view) {
    if (this.currentView === view) return;
    
    this.currentView = view;
    
    // Update active state in bottom nav
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === view) {
            item.classList.add('active');
        }
    });
    
    this.updateView();
    this.renderCurrentView();
    this.updateEventsSidebar();
}

updateView() {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    
    // Show current view
    document.getElementById(`${this.currentView}View`).classList.add('active');
    
    // Update view toggle button text
    const viewNames = { month: 'Месяц', week: 'Неделя', day: 'День' };
    document.getElementById('viewToggle').textContent = viewNames[this.currentView];
}

// Enhanced mobile event handling
setupMobileEventHandlers() {
    if (!this.isMobile) return;

    // Improved touch handling for events
    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('.event-card') || e.target.closest('.event-preview')) {
            // Add visual feedback
            const element = e.target.closest('.event-card') || e.target.closest('.event-preview');
            element.style.transform = 'scale(0.98)';
        }
    });

    document.addEventListener('touchend', (e) => {
        if (e.target.closest('.event-card') || e.target.closest('.event-preview')) {
            const element = e.target.closest('.event-card') || e.target.closest('.event-preview');
            element.style.transform = '';
        }
    });
}

// Update the existing init method to include mobile setup
async init() {
    this.setupEventListeners();
    await this.setupAuthListener();
    this.adjustForMobile();
    
    if (this.isMobile) {
        this.setupMobileGestures();
        this.setupMobileNavigation();
        this.setupMobileEventHandlers();
    }
}

// Update renderMonthView to use mobile version on mobile devices
renderMonthView() {
    if (this.isMobile) {
        this.createMobileMonthView();
    } else {
        // Original month view logic
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
}
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.events = [];
        this.currentView = 'month';
        this.selectedEvent = null;
        this.sidebarView = 'today';
        this.isMobile = this.checkMobile();
        this.user = null;
        this.unsubscribeEvents = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.setupAuthListener();
        this.adjustForMobile();
    }

    async setupAuthListener() {
        // Wait for Firebase to be available
        if (!window.firebase) {
            console.error('Firebase not loaded');
            setTimeout(() => this.setupAuthListener(), 100);
            return;
        }

        const { auth, onAuthStateChanged } = window.firebase.auth;
        
        onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user);
            if (user) {
                this.user = user;
                await this.showCalendarApp();
                await this.loadEventsFromFirebase();
                this.render();
                this.updateEventsSidebar();
            } else {
                this.showLoginScreen();
            }
        });
    }

    async showCalendarApp() {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('registerScreen').classList.remove('active');
        document.getElementById('forgotPasswordScreen').classList.remove('active');
        document.getElementById('calendarApp').style.display = 'block';
        
        // Update user info
        document.getElementById('userName').textContent = this.user.displayName || this.user.email;
        if (this.user.photoURL) {
            document.getElementById('userAvatar').src = this.user.photoURL;
        } else {
            document.getElementById('userAvatar').src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.user.displayName || this.user.email) + '&background=6366f1&color=fff';
        }
    }

    showLoginScreen() {
        document.getElementById('calendarApp').style.display = 'none';
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('registerScreen').classList.remove('active');
        document.getElementById('forgotPasswordScreen').classList.remove('active');
    }

    async loadEventsFromFirebase() {
        if (!this.user) {
            console.log('No user, skipping events load');
            return;
        }

        console.log('Loading events for user:', this.user.uid);

        const { firestore } = window.firebase;
        const db = firestore.db;
        
        // Unsubscribe from previous listener
        if (this.unsubscribeEvents) {
            this.unsubscribeEvents();
        }

        try {
            // Real-time updates
            this.unsubscribeEvents = firestore.onSnapshot(
                firestore.doc(db, "users", this.user.uid, "data", "calendar"), 
                (docSnap) => {
                    this.showLoading(true);
                    
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        this.events = data.events || [];
                        console.log('Events updated from Firebase:', this.events.length);
                    } else {
                        this.events = [];
                        console.log('No events found, creating initial document');
                        // Create initial document
                        this.saveEventsToFirebase();
                    }
                    
                    this.renderCurrentView();
                    this.updateEventsSidebar();
                    
                    setTimeout(() => this.showLoading(false), 500);
                },
                (error) => {
                    console.error("Error loading events:", error);
                    this.showNotification('Ошибка загрузки событий', 'error');
                    this.showLoading(false);
                }
            );
        } catch (error) {
            console.error("Error setting up events listener:", error);
            this.showNotification('Ошибка подключения к базе данных', 'error');
        }
    }

    async saveEventsToFirebase() {
        if (!this.user) {
            console.log('No user, skipping save');
            return;
        }

        try {
            const { firestore } = window.firebase;
            const db = firestore.db;
            
            await firestore.setDoc(
                firestore.doc(db, "users", this.user.uid, "data", "calendar"), 
                {
                    events: this.events,
                    lastUpdated: new Date().toISOString(),
                    userId: this.user.uid
                }
            );
            
            console.log('Events saved to Firebase');
        } catch (error) {
            console.error("Error saving events:", error);
            this.showNotification('Ошибка сохранения событий: ' + error.message, 'error');
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }

    checkMobile() {
        return window.innerWidth <= 768;
    }

    adjustForMobile() {
        if (this.isMobile) {
            document.body.classList.add('mobile');
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

    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    parseDateString(dateString) {
        const parts = dateString.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
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
            
            dayEvents.slice(0, 2).forEach(event => {
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

    async changeMonth(direction) {
        // Add animation
        const grid = document.getElementById('monthGrid');
        grid.style.animation = 'slideOut 0.3s ease';
        
        setTimeout(() => {
            this.currentDate.setMonth(this.currentDate.getMonth() + direction);
            this.renderMonthView();
            this.updateCurrentMonth();
            this.updateEventsSidebar();
            
            grid.style.animation = 'slideIn 0.3s ease';
            
            setTimeout(() => {
                grid.style.animation = '';
            }, 300);
        }, 150);
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

        document.getElementById('deleteBtn').onclick = () => {
            this.deleteEventFromModal();
        };
    }

    async saveEvent() {
        if (!this.user) {
            this.showNotification('Войдите в систему для сохранения событий', 'error');
            return;
        }

        const eventId = document.getElementById('eventId').value;
        
        const event = {
            id: eventId || Date.now().toString(),
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            startTime: document.getElementById('eventStartTime').value,
            endTime: document.getElementById('eventEndTime').value,
            description: document.getElementById('eventDescription').value,
            location: document.getElementById('eventLocation').value,
            color: document.querySelector('input[name="eventColor"]:checked').value,
            createdAt: eventId ? this.events.find(e => e.id === eventId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (!event.title.trim()) {
            this.showNotification('Введите название события', 'error');
            return;
        }

        if (!event.date) {
            this.showNotification('Выберите дату события', 'error');
            return;
        }

        this.showLoading(true);

        if (eventId) {
            const index = this.events.findIndex(e => e.id === eventId);
            if (index !== -1) {
                this.events[index] = event;
            }
        } else {
            this.events.push(event);
        }

        await this.saveEventsToFirebase();
        
        this.hideEventModal();
        this.showNotification(eventId ? 'Событие обновлено!' : 'Событие создано!');
    }

    async deleteEventFromModal() {
        const eventId = document.getElementById('eventId').value;
        if (eventId) {
            if (confirm('Вы уверены, что хотите удалить это событие?')) {
                this.showLoading(true);
                this.events = this.events.filter(e => e.id !== eventId);
                await this.saveEventsToFirebase();
                this.hideEventModal();
                this.showNotification('Событие удалено!');
            }
        }
    }

    showNotification(message, type = 'success') {
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
        
        const colorRadios = document.querySelectorAll('input[name="eventColor"]');
        colorRadios.forEach(radio => {
            radio.checked = (radio.value === event.color);
        });
        
        document.getElementById('deleteBtn').style.display = 'block';
        this.showEventModal();
    }

    async deleteEvent() {
        if (this.selectedEvent) {
            this.showLoading(true);
            this.events = this.events.filter(e => e.id !== this.selectedEvent.id);
            await this.saveEventsToFirebase();
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
        
        // Add view transition animation
        const currentViewElement = document.getElementById(`${this.currentView}View`);
        const nextViewElement = document.getElementById(`${views[nextIndex]}View`);
        
        currentViewElement.style.animation = 'fadeOut 0.3s ease';
        
        setTimeout(() => {
            document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
            this.currentView = views[nextIndex];
            nextViewElement.classList.add('active');
            nextViewElement.style.animation = 'fadeIn 0.3s ease';
            
            this.renderCurrentView();
            
            setTimeout(() => {
                currentViewElement.style.animation = '';
                nextViewElement.style.animation = '';
            }, 300);
        }, 150);
        
        const toggleBtn = document.getElementById('viewToggle');
        const viewNames = { month: 'Месяц', week: 'Неделя', day: 'День' };
        toggleBtn.textContent = viewNames[this.currentView];
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

        document.addEventListener('touchstart', (e) => {
            if (!e.target.closest('.context-menu')) {
                document.getElementById('contextMenu').classList.remove('active');
            }
        });

        window.addEventListener('resize', () => {
            this.isMobile = this.checkMobile();
            this.adjustForMobile();
        });
    }

    showAddEventModal() {
        document.getElementById('modalTitle').textContent = '➕ Создать событие';
        document.getElementById('eventId').value = '';
        document.getElementById('eventForm').reset();
        document.getElementById('deleteBtn').style.display = 'none';
        
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

// Authentication Functions
async function loginWithEmail() {
    if (!window.firebase) {
        alert('Firebase не загружен. Подождите немного и попробуйте снова.');
        return;
    }

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        calendar.showNotification('Заполните все поля', 'error');
        return;
    }

    try {
        const { auth, signInWithEmailAndPassword } = window.firebase.auth;
        await signInWithEmailAndPassword(auth, email, password);
        calendar.showNotification('Вход выполнен успешно!');
    } catch (error) {
        console.error('Login error:', error);
        calendar.showNotification('Ошибка входа: ' + error.message, 'error');
    }
}

async function registerWithEmail() {
    if (!window.firebase) {
        alert('Firebase не загружен. Подождите немного и попробуйте снова.');
        return;
    }

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (!name || !email || !password || !confirmPassword) {
        calendar.showNotification('Заполните все поля', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        calendar.showNotification('Пароли не совпадают', 'error');
        return;
    }
    
    if (password.length < 6) {
        calendar.showNotification('Пароль должен быть не менее 6 символов', 'error');
        return;
    }

    try {
        const { auth, createUserWithEmailAndPassword, updateProfile } = window.firebase.auth;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update profile with name
        await updateProfile(userCredential.user, {
            displayName: name
        });
        
        calendar.showNotification('Аккаунт создан успешно!');
        showLoginForm();
    } catch (error) {
        console.error('Registration error:', error);
        calendar.showNotification('Ошибка регистрации: ' + error.message, 'error');
    }
}

async function loginWithGoogle() {
    if (!window.firebase) {
        alert('Firebase не загружен. Подождите немного и попробуйте снова.');
        return;
    }

    try {
        const { auth, signInWithPopup, googleProvider } = window.firebase.auth;
        await signInWithPopup(auth, googleProvider);
        calendar.showNotification('Вход через Google выполнен!');
    } catch (error) {
        console.error('Google login error:', error);
        calendar.showNotification('Ошибка входа через Google: ' + error.message, 'error');
    }
}

async function resetPassword() {
    if (!window.firebase) {
        alert('Firebase не загружен. Подождите немного и попробуйте снова.');
        return;
    }

    const email = document.getElementById('forgotEmail').value;
    
    if (!email) {
        calendar.showNotification('Введите email', 'error');
        return;
    }

    try {
        const { auth, sendPasswordResetEmail } = window.firebase.auth;
        await sendPasswordResetEmail(auth, email);
        calendar.showNotification('Ссылка для сброса пароля отправлена на email');
        showLoginForm();
    } catch (error) {
        console.error('Password reset error:', error);
        calendar.showNotification('Ошибка: ' + error.message, 'error');
    }
}

async function logout() {
    if (!window.firebase) {
        alert('Firebase не загружен. Подождите немного и попробуйте снова.');
        return;
    }

    try {
        const { auth, signOut } = window.firebase.auth;
        await signOut(auth);
        calendar.showNotification('Выход выполнен');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function showLoginForm() {
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('registerScreen').classList.remove('active');
    document.getElementById('forgotPasswordScreen').classList.remove('active');
}

function showRegisterForm() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('registerScreen').classList.add('active');
    document.getElementById('forgotPasswordScreen').classList.remove('active');
}

function showForgotPassword() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('registerScreen').classList.remove('active');
    document.getElementById('forgotPasswordScreen').classList.add('active');
}

// Global Functions
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
// Auto-inject mobile navigation when needed
function setupMobileFeatures() {
    if (window.innerWidth <= 768) {
        // Add mobile-specific classes
        document.body.classList.add('mobile-device');
        
        // Prevent zoom on input focus
        document.addEventListener('touchstart', function() {}, {passive: true});
        
        // Improve touch scrolling
        document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
    }
}

// Update on resize
window.addEventListener('resize', setupMobileFeatures);

// Initial setup
document.addEventListener('DOMContentLoaded', setupMobileFeatures);
