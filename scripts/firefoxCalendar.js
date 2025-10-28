/**
 * Detects if the browser is Firefox.
 * @returns {boolean}
 */
function isFirefoxBrowser() {
  return /firefox/i.test(navigator.userAgent);
}

/**
 * Wraps the date input in a positioned container if not already wrapped.
 * @param {HTMLElement} input
 * @returns {HTMLElement} The wrapper element
 */
function ensureDateInputWrapper(input) {
  if (input.parentElement?.classList.contains('date-input-wrapper')) {
    return input.parentElement;
  }
  
  const wrapper = document.createElement('div');
  wrapper.className = 'date-input-wrapper';
  wrapper.style.position = 'relative';
  wrapper.style.width = '100%';
  
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);
  
  return wrapper;
}

/**
 * Renders the calendar UI with month/year navigation and selectable days.
 * @param {HTMLElement} container - The calendar container element
 * @param {Date} currentDate - The date to display (defaults to today)
 * @returns {void}
 */
function renderCalendarUI(container, currentDate = new Date()) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
  
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Build header with navigation
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e0e0e0;
  `;
  
  const prevBtn = createNavButton('‹', () => {
    const newDate = new Date(year, month - 1, 1);
    container.innerHTML = '';
    renderCalendarUI(container, newDate);
  });
  
  const monthYearLabel = document.createElement('div');
  monthYearLabel.textContent = `${monthNames[month]} ${year}`;
  monthYearLabel.style.cssText = `
    font-weight: 600;
    font-size: 15px;
    color: #2a3647;
  `;
  
  const nextBtn = createNavButton('›', () => {
    const newDate = new Date(year, month + 1, 1);
    container.innerHTML = '';
    renderCalendarUI(container, newDate);
  });
  
  header.appendChild(prevBtn);
  header.appendChild(monthYearLabel);
  header.appendChild(nextBtn);
  container.appendChild(header);
  
  // Weekday headers
  const weekdaysContainer = document.createElement('div');
  weekdaysContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 4px;
  `;
  
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  weekdays.forEach(day => {
    const dayLabel = document.createElement('div');
    dayLabel.textContent = day;
    dayLabel.style.cssText = `
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: #666;
      padding: 4px 0;
    `;
    weekdaysContainer.appendChild(dayLabel);
  });
  container.appendChild(weekdaysContainer);
  
  // Days grid
  const daysContainer = document.createElement('div');
  daysContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  `;
  
  // Empty cells before first day
  const adjustedStart = startingDayOfWeek; // 0-6, Sunday = 0
  for (let i = 0; i < adjustedStart; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.style.cssText = 'height: 32px;';
    daysContainer.appendChild(emptyCell);
  }
  
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    dayDate.setHours(0, 0, 0, 0);
    
    const isPast = dayDate < today;
    const isToday = dayDate.getTime() === today.getTime();
    
    const dayCell = document.createElement('div');
    dayCell.textContent = day;
    dayCell.className = 'calendar-day';
    dayCell.dataset.date = formatDate(dayDate);
    
    let bgColor = 'white';
    let color = '#2a3647';
    let cursor = 'pointer';
    let hoverBg = '#f0f0f0';
    
    if (isPast) {
      color = '#ccc';
      cursor = 'not-allowed';
      hoverBg = 'white';
    } else if (isToday) {
      bgColor = '#29abe2';
      color = 'white';
      hoverBg = '#1a8fc4';
    }
    
    dayCell.style.cssText = `
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      font-size: 13px;
      font-weight: ${isToday ? '600' : '400'};
      background-color: ${bgColor};
      color: ${color};
      cursor: ${cursor};
      transition: background-color 0.15s ease;
    `;
    
    if (!isPast) {
      dayCell.addEventListener('mouseenter', () => {
        dayCell.style.backgroundColor = hoverBg;
      });
      dayCell.addEventListener('mouseleave', () => {
        dayCell.style.backgroundColor = bgColor;
      });
      dayCell.addEventListener('click', (e) => {
        e.stopPropagation();
        setDateValue(dayCell.dataset.date);
      });
    }
    
    daysContainer.appendChild(dayCell);
  }
  
  container.appendChild(daysContainer);
  
  // Today button
  const todayBtn = document.createElement('button');
  todayBtn.textContent = 'Today';
  todayBtn.style.cssText = `
    width: 100%;
    margin-top: 12px;
    padding: 8px;
    border: 1px solid #29abe2;
    background: white;
    color: #29abe2;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  `;
  todayBtn.addEventListener('mouseenter', () => {
    todayBtn.style.backgroundColor = '#29abe2';
    todayBtn.style.color = 'white';
  });
  todayBtn.addEventListener('mouseleave', () => {
    todayBtn.style.backgroundColor = 'white';
    todayBtn.style.color = '#29abe2';
  });
  todayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setDateValue(formatDate(new Date()));
  });
  container.appendChild(todayBtn);
}

/**
 * Creates a navigation button (prev/next month).
 * @param {string} symbol - The button text/symbol
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement}
 */
function createNavButton(symbol, onClick) {
  const btn = document.createElement('button');
  btn.textContent = symbol;
  btn.style.cssText = `
    width: 28px;
    height: 28px;
    border: none;
    background: #f0f0f0;
    color: #2a3647;
    border-radius: 4px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease;
  `;
  btn.addEventListener('mouseenter', () => {
    btn.style.backgroundColor = '#29abe2';
    btn.style.color = 'white';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.backgroundColor = '#f0f0f0';
    btn.style.color = '#2a3647';
  });
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

/**
 * Formats a Date object as YYYY-MM-DD.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Opens the custom calendar overlay for Firefox.
 * @param {HTMLElement} input - The date input element
 * @returns {void}
 */
function openCustomCalendar(input) {
  // Verhindere mehrfaches Öffnen
  if (document.querySelector('.custom-calendar-overlay')) return;
  
  const wrapper = input.closest('.date-input-wrapper') || input.parentElement;
  
  // Erstelle Kalender-Container
  const calendar = document.createElement('div');
  calendar.className = 'custom-calendar-overlay';
  calendar.style.cssText = `
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 1000;
    background: white;
    border: 1px solid #d1d1d1;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 16px;
    min-width: 280px;
    max-width: 300px;
  `;
  
  // Parse existing value or use today
  let initialDate = new Date();
  if (input.value) {
    const parsed = new Date(input.value);
    if (!isNaN(parsed)) initialDate = parsed;
  }
  
  // Render calendar UI
  renderCalendarUI(calendar, initialDate);
  
  wrapper.appendChild(calendar);
  
  // Schließe beim Klick außerhalb (mit Verzögerung)
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!calendar.contains(e.target) && e.target !== input) {
        calendar.remove();
        document.removeEventListener('click', closeHandler, true);
      }
    };
    document.addEventListener('click', closeHandler, true);
  }, 50);
}

/**
 * Programmatically sets a date value (works for both native and custom calendar).
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {void}
 */
function setDateValue(dateString) {
  const input = document.getElementById("date");
  if (!input) return;
  
  input.value = dateString;
  
  // Schließe Custom-Kalender falls offen
  const calendar = document.querySelector('.custom-calendar-overlay');
  if (calendar) calendar.remove();
  
  // Trigger change event für andere Listener
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Initializes the date input with browser-specific behavior.
 * @returns {void}
 */
function initDateMinAndPicker() {
  const input = document.getElementById("date");
  if (!input) return;
  
  // Setze Mindestdatum (heute)
  input.min = new Date().toISOString().split("T")[0];
  
  const isFirefox = isFirefoxBrowser();
  
  if (isFirefox) {
    // ========== FIREFOX: Deaktiviere nativen Datepicker ==========
    input.type = "text";
    input.placeholder = "YYYY-MM-DD";
    input.readOnly = true; // Verhindert manuelle Eingabe
    
    // Stelle sicher, dass Input in positioniertem Container liegt
    ensureDateInputWrapper(input);
    
    // Öffne Custom-Kalender beim Klick
    input.addEventListener("click", (e) => {
      e.stopPropagation();
      openCustomCalendar(input);
    });
    
    // Optional: Verhindere Focus-Event
    input.addEventListener("focus", (e) => {
      e.preventDefault();
      input.blur();
      openCustomCalendar(input);
    });
    
  } else {
    // ========== CHROME/EDGE/SAFARI: Nutze nativen Datepicker ==========
    input.type = "date";
    
    input.addEventListener("click", (e) => {
      e.stopPropagation();
      try {
        if (input.showPicker && typeof input.showPicker === 'function') {
          input.showPicker();
        } else {
          input.focus();
        }
      } catch (err) {
        input.focus();
      }
    });
  }
}

/* ======================== Global API Exposure ======================== */

window.initDateMinAndPicker ??= initDateMinAndPicker;
window.openCustomCalendar ??= openCustomCalendar;
window.setDateValue ??= setDateValue;
window.isFirefoxBrowser ??= isFirefoxBrowser;