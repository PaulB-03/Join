/**
 * Inserts basic calendar styles once.
 * @returns {void}
 */
function addCalendarStyles() {
  if (document.getElementById("cal-styles")) return;
  const css = `
  .date-input-wrapper{position:relative;width:100%}
  .custom-calendar-overlay{position:absolute;top:calc(100% + 4px);left:0;z-index:1000;background:#fff;border:1px solid #d1d1d1;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);padding:12px;min-width:280px}
  .cal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e0e0e0}
  .cal-title{font-weight:600;font-size:15px;color:#2a3647}
  .cal-week,.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
  .cal-week div{font:600 11px/1 sans-serif;color:#666;text-align:center;padding:4px 0}
  .cal-day{height:32px;border:none;border-radius:4px;background:#fff;color:#2a3647;cursor:pointer;font:400 13px/32px sans-serif}
  .cal-day:hover{background:#f0f0f0}
  .cal-day.past{color:#bbb;cursor:not-allowed;background:#fff}
  .cal-day.past:hover{background:#fff}
  .cal-day.today{background:#29abe2;color:#fff;font-weight:600}
  .cal-nav{width:28px;height:28px;border:none;background:#f0f0f0;color:#2a3647;border-radius:4px;font-weight:700;cursor:pointer}
  .cal-nav:hover{background:#29abe2;color:#fff}
  .cal-today{width:100%;margin-top:8px;padding:8px;border:1px solid #29abe2;background:#fff;color:#29abe2;border-radius:4px;cursor:pointer}
  .cal-today:hover{background:#29abe2;color:#fff}`.trim();
  const style = document.createElement("style");
  style.id = "cal-styles";
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * Detects whether the current browser is Firefox.
 * @returns {boolean} True if browser is Firefox.
 */
function isFirefoxBrowser() {
  return /firefox/i.test(navigator.userAgent);
}

/**
 * Ensures the date input is wrapped inside a positioned container.
 * @param {HTMLElement} input - The date input element.
 * @returns {HTMLElement} The wrapper element.
 */
function ensureDateInputWrapper(input) {
  const p = input.parentElement;
  if (p?.classList.contains("date-input-wrapper")) return p;
  const w = document.createElement("div");
  w.className = "date-input-wrapper";
  input.parentNode.insertBefore(w, input);
  w.appendChild(input);
  return w;
}

/**
 * Formats a Date object as YYYY-MM-DD.
 * @param {Date} date - The date object.
 * @returns {string} Formatted date string.
 */
function formatDate(date) {
  const y = date.getFullYear(),
    m = String(date.getMonth() + 1).padStart(2, "0"),
    d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Renders the calendar UI with navigation and selectable days.
 * @param {HTMLElement} container - The target container element.
 * @param {Date} currentDate - The month to display.
 * @returns {void}
 */
function renderCalendarUI(container, currentDate = new Date()) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = currentDate.getFullYear(),
    m = currentDate.getMonth();
  const first = new Date(y, m, 1),
    last = new Date(y, m + 1, 0),
    start = first.getDay(),
    days = last.getDate();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let html = `<div class="cal-head"><button class="cal-nav" data-nav="-1">‹</button><div class="cal-title">${months[m]} ${y}</div><button class="cal-nav" data-nav="1">›</button></div>`;
  html += `<div class="cal-week">${["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
    .map((d) => `<div>${d}</div>`)
    .join("")}</div>`;
  let grid = `<div class="cal-grid">${"<div></div>".repeat(start)}`;
  for (let d = 1; d <= days; d++) {
    const dt = new Date(y, m, d);
    dt.setHours(0, 0, 0, 0);
    const past = dt < today,
      isT = dt.getTime() === today.getTime(),
      cls = past ? " past" : isT ? " today" : "";
    grid += `<button class="cal-day${cls}" ${
      past ? "disabled" : ""
    } data-date="${formatDate(dt)}">${d}</button>`;
  }
  container.innerHTML =
    html +
    grid +
    `</div><button class="cal-today" data-today="1">Today</button>`;
  container.onclick = (e) => {
    const t = e.target;
    if (t.matches("[data-nav]"))
      return (
        (container.innerHTML = ""),
        renderCalendarUI(container, new Date(y, m + Number(t.dataset.nav), 1))
      );
    if (t.matches(".cal-day:not(.past)")) return setDateValue(t.dataset.date);
    if (t.matches("[data-today]")) return setDateValue(formatDate(new Date()));
  };
}

/**
 * Opens the custom calendar overlay (for Firefox only).
 * @param {HTMLElement} input - The date input element.
 * @returns {void}
 */
function openCustomCalendar(input) {
  if (document.querySelector(".custom-calendar-overlay")) return;
  addCalendarStyles();
  const wrapper = ensureDateInputWrapper(input);
  const cal = document.createElement("div");
  cal.className = "custom-calendar-overlay";
  wrapper.appendChild(cal);
  const initDate =
    input.value && !isNaN(new Date(input.value))
      ? new Date(input.value)
      : new Date();
  renderCalendarUI(cal, initDate);
  setTimeout(() => {
    const close = (e) => {
      if (!cal.contains(e.target) && e.target !== input) {
        cal.remove();
        document.removeEventListener("click", close, true);
      }
    };
    document.addEventListener("click", close, true);
  }, 30);
}

/**
 * Sets a date value and triggers a "change" event.
 * @param {string} dateString - The date in YYYY-MM-DD format.
 * @returns {void}
 */
function setDateValue(dateString) {
  const input = document.getElementById("date");
  if (!input) return;
  input.value = dateString;
  document.querySelector(".custom-calendar-overlay")?.remove();
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Initializes the date input with min date and picker behavior.
 * @returns {void}
 */
function initDateMinAndPicker() {
  const input = document.getElementById("date");
  if (!input) return;
  input.min = new Date().toISOString().split("T")[0];
  if (isFirefoxBrowser()) {
    input.type = "text";
    input.placeholder = "YYYY-MM-DD";
    input.readOnly = true;
    ensureDateInputWrapper(input);
    addCalendarStyles();
    input.addEventListener("click", (e) => {
      e.stopPropagation();
      openCustomCalendar(input);
    });
    input.addEventListener("focus", (e) => {
      e.preventDefault();
      input.blur();
      openCustomCalendar(input);
    });
  } else {
    input.type = "date";
    input.addEventListener("click", (e) => {
      e.stopPropagation();
      try {
        input.showPicker?.();
      } catch {
        input.focus();
      }
    });
  }
}

/* ======================== Global API ======================== */
window.initDateMinAndPicker ??= initDateMinAndPicker;
window.openCustomCalendar ??= openCustomCalendar;
window.setDateValue ??= setDateValue;
window.isFirefoxBrowser ??= isFirefoxBrowser;
