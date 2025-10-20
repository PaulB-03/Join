/**
 * Normalizes priority strings to canonical values.
 * @param {string} prio
 * @returns {"urgent"|"medium"|"low"}
 */
function normalizePrio(prio) {
  const p = String(prio || "").toLowerCase();
  if (p.startsWith("urg")) return "urgent";
  if (p.startsWith("med")) return "medium";
  if (p.startsWith("low")) return "low";
  return "medium";
}

/**
 * Returns human-readable priority label.
 * @param {string} prio
 * @returns {string}
 */
function getPriorityLabel(prio) {
  const p = normalizePrio(prio);
  return p.charAt(0).toUpperCase() + p.slice(1);
}

/**
 * Formats a date to "DD/MM/YYYY".
 * Accepts Date or strings like "2023-10-02".
 * @param {Date|string} value
 * @returns {string}
 */
function formatDate(value) {
  if (!value) return "-";
  let d;
  if (value instanceof Date) d = value;
  else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, dd] = value.split("-").map(Number);
    d = new Date(y, m - 1, dd);
  } else {
    d = new Date(value);
    if (Number.isNaN(+d)) return escapeHtml(String(value));
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/**
 * Returns a background color for a name or index.
 * Delegates to window.colorForName when available.
 * @param {string} name
 * @param {number} i
 * @returns {string}
 */
function bgForNameOrIndex(name, i) {
  if (typeof window !== "undefined" && typeof window.colorForName === "function") {
    return window.colorForName(name || "");
  }
  return "#999";
}

/**
 * Returns priority icon HTML snippet.
 * @param {string} prio
 * @returns {string}
 */
function getPriorityIcon(prio) {
  switch ((prio || "").toLowerCase()) {
    case "urgent": return `<img src="../assets/svg/double_arrow_red.svg" alt="Urgent" class="priority-icon" />`;
    case "medium": return `<img src="../assets/svg/double_lines.svg" alt="Medium" class="priority-icon" />`;
    case "low":    return `<img src="../assets/svg/double_arrow_down.svg" alt="Low" class="priority-icon" />`;
    default:       return "";
  }
}

/**
 * Returns a badge HTML for the given priority.
 * @param {string} prio
 * @returns {string}
 */
function getPriorityBadge(prio) {
  const p = normalizePrio(prio);
  const label = getPriorityLabel(p);
  let icon = "";
  if (p === "urgent") icon = `<img src="../assets/svg/double_arrow_red.svg" alt="${label}" class="priority-icon" />`;
  else if (p === "medium") icon = `<img src="../assets/svg/double_lines.svg" alt="${label}" class="priority-icon" />`;
  else if (p === "low") icon = `<img src="../assets/svg/double_arrow_down.svg" alt="${label}" class="priority-icon" />`;
  return `<span class="priority"><h6 class="priority-text">${label}</h6>${icon}</span>`;
}

/**
 * Opens swap menu for a task card.
 * @param {MouseEvent} event
 * @returns {void}
 */
function swapState(event) {
  event.stopPropagation();
  const id = event.target.closest("article").getAttribute("data-id");
  const taskForMenu = document.querySelectorAll(`[data-id=${id}]`);
  if (document.getElementsByClassName("swapMenu")) closeSwapMenu();
  taskForMenu[1].innerHTML += getSwapTemplate();
  addEventlistenerOnSwapMenu(id);
}

/**
 * Adds a body-level listener to close the swap menu.
 * @returns {void}
 */
function checkSwapMenu() {
  const body = document.getElementById("body");
  body.addEventListener("click", closeSwapMenu);
}

/**
 * Wires swap menu items to state change handlers.
 * @param {string} id
 * @returns {void}
 */
function addEventlistenerOnSwapMenu(id) {
  const menu = document.getElementById("swapMenu");
  const items = menu.getElementsByTagName("li");
  menu.addEventListener("click", swapMenuLinks);
  items[1]?.addEventListener("mousedown", (e) => addInState(id, e, "toDo"));
  items[2]?.addEventListener("mousedown", (e) => addInState(id, e, "in progress"));
  items[3]?.addEventListener("mousedown", (e) => addInState(id, e, "await feedback"));
  items[4]?.addEventListener("mousedown", (e) => addInState(id, e, "done"));
}

/**
 * Stops event bubbling inside the swap menu.
 * @param {Event} event
 * @returns {void}
 */
function swapMenuLinks(event) {
  event.stopPropagation();
}

/**
 * Updates task state, refreshes UI, closes menu.
 * @param {string} id
 * @param {Event} event
 * @param {string} state
 * @returns {Promise<void>}
 */
async function addInState(id, event, state) {
  event.stopPropagation();
  await updateTaskState(id, state);
  init();
  closeSwapMenu();
  console.log("addInProgress");
}

/**
 * Closes/removes the swap menu if present.
 * @returns {void}
 */
function closeSwapMenu() {
  const menu = document.getElementById("swapMenu");
  if (menu) menu.remove();
}
