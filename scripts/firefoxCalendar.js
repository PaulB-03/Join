/**
 * Checks if the current browser is Firefox.
 * @returns {boolean} True if Firefox is detected.
 */
function isFirefoxBrowser() {
  return /firefox/i.test(navigator.userAgent);
}

/**
 * Ensures the input is wrapped in .date-input-wrapper.
 * @param {HTMLInputElement} input - The date input.
 * @returns {HTMLDivElement} The wrapper element.
 */
function ensureDateInputWrapper(input) {
  const p = input.parentElement;
  if (p?.classList.contains("date-input-wrapper")) return /** @type {HTMLDivElement} */(p);
  const w = document.createElement("div");
  w.className = "date-input-wrapper";
  input.parentNode.insertBefore(w, input);
  w.appendChild(input);
  return w;
}

/**
 * Formats a Date object as "YYYY-MM-DD".
 * @param {Date} date - The date to format.
 * @returns {string} The formatted string.
 */
function formatDate(date) {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Builds the week header HTML (Su–Sa).
 * @returns {string} HTML string for the week header.
 */
function buildWeekHTML() {
  return ["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>`<div>${d}</div>`).join("");
}

/**
 * Builds the calendar head with title and nav buttons.
 * @param {number} y - Year.
 * @param {number} m - Month (0–11).
 * @param {boolean} canPrev - Whether previous month is allowed.
 * @returns {string} Head HTML.
 */
function buildHeadHTML(y, m, canPrev) {
  const title = new Date(y, m, 1).toLocaleString("en", { month: "long" }) + ` ${y}`;
  return `<div class="cal-head"><div class="cal-title">${title}</div>
    <div class="cal-nav-group">
      <button class="cal-nav" data-nav="-1" ${!canPrev ? "disabled" : ""}>‹</button>
      <button class="cal-nav" data-nav="1">›</button>
    </div></div>`;
}

/**
 * Builds the day cells for the given month.
 * Past days are disabled; today is highlighted.
 * @param {number} y - Year.
 * @param {number} m - Month (0–11).
 * @param {Date} today - Truncated to 00:00.
 * @returns {string} Cells HTML.
 */
function buildCellsHTML(y, m, today) {
  const first = new Date(y, m, 1).getDay();
  const last = new Date(y, m + 1, 0).getDate();
  let cells = `${"<div></div>".repeat(first)}`;
  for (let d = 1; d <= last; d++) {
    const dt = new Date(y, m, d); dt.setHours(0,0,0,0);
    const past = dt < today, isT = dt.getTime() === today.getTime();
    cells += `<button class="cal-day${isT ? " today" : past ? " past" : ""}" 
      ${past ? "disabled" : ""} data-date="${formatDate(dt)}">${d}</button>`;
  }
  return cells;
}

/**
 * Handles clicks inside the calendar (nav and day select).
 * @param {HTMLElement} container - Calendar container.
 * @param {number} y - Current year.
 * @param {number} m - Current month (0–11).
 * @returns {void}
 */
function attachCalendarHandlers(container, y, m) {
  container.onclick = (e) => {
    const t = /** @type {HTMLElement} */(e.target);
    if (t.matches("[data-nav]"))
      return renderCalendarUI(container, new Date(y, m + Number(t.dataset.nav), 1));
    if (t.matches(".cal-day") && !t.classList.contains("past"))
      setDateValue(/** @type {HTMLButtonElement} */(t).dataset.date);
  };
}

/**
 * Renders the calendar UI for a given month.
 * @param {HTMLElement} container - Target container.
 * @param {Date} [currentDate=new Date()] - Month to display.
 * @returns {void}
 */
function renderCalendarUI(container, currentDate = new Date()) {
  const today = new Date(); today.setHours(0,0,0,0);
  const y = currentDate.getFullYear(), m = currentDate.getMonth();
  const view = new Date(y, m, 1), min = new Date(today.getFullYear(), today.getMonth(), 1);
  const canPrev = view > min;
  const head = buildHeadHTML(y, m, canPrev);
  const week = `<div class="cal-week">${buildWeekHTML()}</div>`;
  const grid = `<div class="cal-grid">${buildCellsHTML(y, m, today)}</div>`;
  container.innerHTML = head + week + grid;
  attachCalendarHandlers(container, y, m);
}

/**
 * Opens the custom calendar overlay (Firefox only).
 * @param {HTMLInputElement} input - The date input element.
 * @returns {void}
 */
function openCustomCalendar(input) {
  if (document.querySelector(".custom-calendar-overlay")) return;
  const wrap = ensureDateInputWrapper(input);
  const cal = document.createElement("div"); cal.className = "custom-calendar-overlay";
  wrap.appendChild(cal);
  const init = input.value && !isNaN(new Date(input.value)) ? new Date(input.value) : new Date();
  renderCalendarUI(cal, init);
  setTimeout(() => {
    const close = (e) => { if (!cal.contains(/** @type {Node} */(e.target)) && e.target !== input) {
      cal.remove(); document.removeEventListener("click", close, true);
    }};
    document.addEventListener("click", close, true);
  }, 0);
}

/**
 * Sets the selected date and dispatches a "change" event.
 * @param {string} dateString - Date in "YYYY-MM-DD" format.
 * @returns {void}
 */
function setDateValue(dateString) {
  const input = /** @type {HTMLInputElement|null} */(document.getElementById("date"));
  if (!input) return;
  input.value = dateString;
  document.querySelector(".custom-calendar-overlay")?.remove();
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Initializes the date field and picker behavior.
 * Firefox uses a custom overlay; others use native picker.
 * @returns {void}
 */
function initDateMinAndPicker() {
  const input = /** @type {HTMLInputElement|null} */(document.getElementById("date"));
  if (!input) return;
  input.min = new Date().toISOString().split("T")[0];
  if (isFirefoxBrowser()) {
    input.type = "text"; input.readOnly = true; input.placeholder = "YYYY-MM-DD";
    ensureDateInputWrapper(input);
    input.addEventListener("click", () => openCustomCalendar(input));
    input.addEventListener("focus", () => openCustomCalendar(input));
  } else {
    input.type = "date";
    input.addEventListener("click", () => { try { input.showPicker?.(); } catch { input.focus(); } });
  }
}

window.initDateMinAndPicker ??= initDateMinAndPicker;
window.openCustomCalendar ??= openCustomCalendar;
window.setDateValue ??= setDateValue;
window.isFirefoxBrowser ??= isFirefoxBrowser;
