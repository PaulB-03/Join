(() => {
  /* ===============================
   *  Base Configuration
   * =============================== */

  /**
   * Base URL for Firebase Realtime Database requests.
   *
   * @constant
   * @type {string}
   */
  const DATABASE_BASE_URL = (typeof baseURL !== "undefined" && baseURL) || DB_ROOT;

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
   * Returns an element by its ID.
   *
   * @function getElementById
   * @param {string} id - The ID of the element to retrieve.
   * @returns {HTMLElement|null} The matching element, or `null` if not found.
   */
  function getElementById(id) {
    return document.getElementById(id);
  }

  /**
   * Returns the first element matching the given CSS selector.
   *
   * @function querySelector
   * @param {string} selector - The CSS selector to match.
   * @param {Document|HTMLElement} [root=document] - The root node to search within.
   * @returns {HTMLElement|null} The first matching element, or `null` if none found.
   */
  function querySelector(selector, root = document) {
    return root.querySelector(selector);
  }

  /**
   * Returns all elements matching the given CSS selector as an array.
   *
   * @function querySelectorAll
   * @param {string} selector - The CSS selector to match.
   * @param {Document|HTMLElement} [root=document] - The root node to search within.
   * @returns {HTMLElement[]} An array of matching elements.
   */
  function querySelectorAll(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  /**
   * Safely attaches an event listener to an element if it exists.
   *
   * @function onEvent
   * @param {HTMLElement|null} element - The target element.
   * @param {string} eventName - The event name (e.g., `"click"`).
   * @param {EventListenerOrEventListenerObject} handler - The event handler function.
   * @param {boolean|AddEventListenerOptions} [options] - Optional event listener options.
   * @returns {void}
   */
  function onEvent(element, eventName, handler, options) {
    if (element) element.addEventListener(eventName, handler, options);
  }

  /**
   * Sets the text content of an element.
   *
   * @function setTextContent
   * @param {HTMLElement|null} element - The target element.
   * @param {string} text - The text to set as content.
   * @returns {void}
   */
  function setTextContent(element, text) {
    if (element) element.textContent = text;
  }

  /**
   * Sets the HTML content of an element.
   *
   * @function setInnerHTML
   * @param {HTMLElement|null} element - The target element.
   * @param {string} html - The HTML markup to insert.
   * @returns {void}
   */
  function setInnerHTML(element, html) {
    if (element) element.innerHTML = html;
  }

  /**
   * Displays an element by setting its `display` style.
   *
   * @function showElement
   * @param {HTMLElement|null} element - The target element.
   * @param {string} [display="block"] - The CSS display value to apply.
   * @returns {void}
   */
  function showElement(element, display = "block") {
    if (element) element.style.display = display;
  }

  /**
   * Hides an element by setting `display: none`.
   *
   * @function hideElement
   * @param {HTMLElement|null} element - The target element.
   * @returns {void}
   */
  function hideElement(element) {
    if (element) element.style.display = "none";
  }

  /**
   * Sends a GET request to the Firebase Realtime Database and returns parsed JSON.
   *
   * @async
   * @function httpGetJson
   * @param {string} path - The database path (relative to the base URL).
   * @returns {Promise<any>} Parsed JSON response.
   * @throws {Error} If the response status is not OK.
   */
  async function httpGetJson(path) {
    const response = await fetch(DATABASE_BASE_URL + path);
    if (!response.ok) throw new Error(`GET ${path} -> ${response.status}`);
    return response.json();
  }

  /**
   * Sends a POST request with a JSON body to the Firebase database.
   *
   * @async
   * @function httpPostJson
   * @param {string} path - The database path (relative to the base URL).
   * @param {Object} body - The request payload.
   * @returns {Promise<any>} Parsed JSON response.
   * @throws {Error} If the response status is not OK.
   */
  async function httpPostJson(path, body) {
    const response = await fetch(DATABASE_BASE_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`POST ${path} -> ${response.status}`);
    return response.json();
  }

  /**
   * Sends a PATCH request with a JSON body to the Firebase database.
   *
   * @async
   * @function httpPatchJson
   * @param {string} path - The database path (relative to the base URL).
   * @param {Object} body - The request payload.
   * @returns {Promise<any>} Parsed JSON response.
   * @throws {Error} If the response status is not OK.
   */
  async function httpPatchJson(path, body) {
    const response = await fetch(DATABASE_BASE_URL + path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`PATCH ${path} -> ${response.status}`);
    return response.json();
  }

  /**
   * Converts a full name into uppercase initials.
   *
   * Examples:
   * - `"John Doe"` → `"JD"`
   * - `"Mary"` → `"M"`
   *
   * @function initials
   * @param {string} [name=""] - The full name.
   * @returns {string} The two-letter uppercase initials.
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
   * Ensures deterministic color assignment for each name.
   *
   * @function colorForName
   * @param {string} [name=""] - The input name.
   * @returns {string} A CSS variable reference (e.g., `var(--contact-bg-blue)`).
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
   * Fetches contact information from Firebase, populates global contact lists,
   * and triggers rendering of the contact dropdown.
   *
   * @async
   * @function loadContactsInAddTask
   * @returns {Promise<void>} Resolves when contacts are successfully loaded.
   */
  async function loadContactsInAddTask() {
    try {
      const contacts = await httpGetJson("contacts.json");
      const list = getElementById("dropdown-list-contacts");
      if (!contacts || !list) return;
      window.loadedContacts = contacts;
      window.allContacts = Object.values(contacts)
        .map((c) => c.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      renderContacts(window.allContacts, contacts);
    } catch (e) {
      console.error("Could not load contacts:", e);
    }
  }

  /**
   * Expose utility functions and constants to the global window object
   * if they are not already defined.
   *
   * @namespace window
   */
  window.DATABASE_BASE_URL ??= DATABASE_BASE_URL;
  window.CONTACT_BG_CSS_VARS ??= CONTACT_BG_CSS_VARS;
  window.getElementById ??= getElementById;
  window.querySelector ??= querySelector;
  window.querySelectorAll ??= querySelectorAll;
  window.onEvent ??= onEvent;
  window.setTextContent ??= setTextContent;
  window.setInnerHTML ??= setInnerHTML;
  window.showElement ??= showElement;
  window.hideElement ??= hideElement;
  window.httpGetJson ??= httpGetJson;
  window.httpPostJson ??= httpPostJson;
  window.httpPatchJson ??= httpPatchJson;
  window.initials ??= initials;
  window.colorForName ??= colorForName;
  window.loadContactsInAddTask ??= loadContactsInAddTask;
})();
