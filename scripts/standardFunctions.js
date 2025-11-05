/**
 * List of CSS variable names used for contact background colors.
 *
 * @constant
 * @type {string[]}
 */
const CONTACT_BG_CSS_VARS = [
  "--contact-bg-blue",
  "--contact-bg-light-blue",
  "--contact-bg-light-green",
  "--contact-bg-purple",
  "--contact-bg-lilac",
  "--contact-bg-green",
  "--contact-bg-pink",
  "--contact-bg-red",
  "--contact-bg-rose",
  "--contact-bg-peach",
  "--contact-bg-orange",
  "--contact-bg-light-orange",
  "--contact-bg-dark-yellow",
  "--contact-bg-medium-yellow",
  "--contact-bg-yellow",
];

/**
 * Safely attaches an event listener to an element if it exists.
 *
 * @param {HTMLElement|null} element
 * @param {string} eventName
 * @param {EventListenerOrEventListenerObject} handler
 * @param {boolean|AddEventListenerOptions} [options]
 */
function onEvent(element, eventName, handler, options) {
  if (element) element.addEventListener(eventName, handler, options);
}

/**
 * Sets the text content of an element.
 *
 * @param {HTMLElement|null} element
 * @param {string} text
 */
function setTextContent(element, text) {
  if (element) element.textContent = text;
}

/**
 * Sets the HTML content of an element.
 *
 * @param {HTMLElement|null} element
 * @param {string} html
 */
function setInnerHTML(element, html) {
  if (element) element.innerHTML = html;
}

/**
 * Displays an element by setting its `display` style.
 *
 * @param {HTMLElement|null} element
 * @param {string} [display="block"]
 */
function showElement(element, display = "block") {
  if (element) element.style.display = display;
}

/**
 * Hides an element by setting `display: none`.
 *
 * @param {HTMLElement|null} element
 */
function hideElement(element) {
  if (element) element.style.display = "none";
}

/**
 * Converts a full name into uppercase initials.
 *
 * @param {string} [name=""]
 * @returns {string}
 */
function initials(name = "") {
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts.at(-1)[0] : "";
  return (first + last).toUpperCase();
}

/**
 * Returns a CSS variable color string based on the character sum of the name.
 *
 * @param {string} [name=""]
 * @returns {string} e.g. `var(--contact-bg-blue)`
 */
function colorForName(name = "") {
  const trimmed = String(name).trim().toLowerCase();
  const sum = Array.from(trimmed).reduce((acc, ch) => acc + ch.codePointAt(0), 0);
  const varName = CONTACT_BG_CSS_VARS[sum % CONTACT_BG_CSS_VARS.length];
  return `var(${varName})`;
}

/**
 * Loads contact data into the "Add Task" view.
 *
 * - fetches from Firebase
 * - populates global lists (assigned to `window` only if _you_ später willst; hier lokal)
 * - triggers rendering via `renderContacts`
 *
 * @returns {Promise<void>}
 */
async function loadContactsInAddTask() {
  try {
    const contacts = await httpGetJson("contacts.json");
    const list = document.getElementById("dropdown-list-contacts");
    if (!contacts || !list) return;
    const allContacts = Object.values(contacts)
      .map((c) => c.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    renderContacts(allContacts, contacts);
  } catch (e) {
    console.error("Could not load contacts:", e);
  }
}
