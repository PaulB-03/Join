(() => {
  /* ===============================
   *  Base Configuration
   * =============================== */

  /** Base URL for Firebase Realtime Database requests. */
  const DATABASE_BASE_URL =
    (typeof baseURL !== "undefined" && baseURL) ||
    "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";

  /** List of CSS variable names used for contact background colors. */
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

  /* ===============================
   *  DOM Utilities
   * =============================== */

  /** Returns an element by its ID. */
  function getElementById(id) { return document.getElementById(id); }

  /** Returns the first element matching the selector. */
  function querySelector(selector, root = document) { return root.querySelector(selector); }

  /** Returns an array of elements matching the selector. */
  function querySelectorAll(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }

  /** Safely attaches an event listener if the element exists. */
  function onEvent(element, eventName, handler, options) {
    if (element) element.addEventListener(eventName, handler, options);
  }

  /** Sets the text content of an element. */
  function setTextContent(element, text) { if (element) element.textContent = text; }

  /** Sets the HTML content of an element. */
  function setInnerHTML(element, html) { if (element) element.innerHTML = html; }

  /** Shows an element with an optional display value. */
  function showElement(element, display = "block") { if (element) element.style.display = display; }

  /** Hides an element. */
  function hideElement(element) { if (element) element.style.display = "none"; }

  /* ===============================
   *  HTTP Utilities
   * =============================== */

  /** Sends a GET request and returns parsed JSON. */
  async function httpGetJson(path) {
    const response = await fetch(DATABASE_BASE_URL + path);
    if (!response.ok) throw new Error(`GET ${path} -> ${response.status}`);
    return response.json();
  }

  /** Sends a POST request with a JSON body. */
  async function httpPostJson(path, body) {
    const response = await fetch(DATABASE_BASE_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`POST ${path} -> ${response.status}`);
    return response.json();
  }

  /** Sends a PATCH request with a JSON body. */
  async function httpPatchJson(path, body) {
    const response = await fetch(DATABASE_BASE_URL + path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`PATCH ${path} -> ${response.status}`);
    return response.json();
  }

  /* ===============================
   *  Name → Initials / Color
   * =============================== */

  /** Converts a full name into two-letter initials. */
  function initials(name = "") {
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts.at(-1)[0] : "";
    return (first + last).toUpperCase();
  }

  /** Returns a CSS variable color based on the character sum of the name. */
  function colorForName(name = "") {
    const trimmed = String(name).trim().toLowerCase();
    const sum = Array.from(trimmed).reduce((acc, ch) => acc + ch.codePointAt(0), 0);
    const varName = CONTACT_BG_CSS_VARS[sum % CONTACT_BG_CSS_VARS.length];
    return `var(${varName})`;
  }

  /* ===============================
   *  Layout Spacing
   * =============================== */

  /**
   * Stores references to key layout elements used for dynamic spacing
   * when dropdowns open and close.
   */
  function ensureLayoutReferences() {
    if (!window.__subtasksBox) {
      const box = getElementById("subtasks");
      window.__subtasksBox = box;
      window.__subtasksStyles = {
        marginTop: box?.style.marginTop || "24px",
        paddingBottom: box?.style.paddingBottom || "50px",
      };
    }
    if (!window.__categoryBox) {
      const box = getElementById("category");
      window.__categoryBox = box;
      window.__categoryStyles = { marginTop: box?.style.marginTop || "24px" };
    }
  }

  /**
   * Resets spacing changes made by dropdown UI adjustments.
   */
  function resetSubtasksSpacing() {
    ensureLayoutReferences();
    const subtasksBox = window.__subtasksBox;
    const subtasksStyles = window.__subtasksStyles;
    const categoryBox = window.__categoryBox;
    const categoryStyles = window.__categoryStyles;

    if (subtasksBox && subtasksStyles) {
      subtasksBox.style.marginTop = subtasksStyles.marginTop;
      subtasksBox.style.paddingBottom = subtasksStyles.paddingBottom;
    }
    if (categoryBox && categoryStyles) {
      categoryBox.style.marginTop = categoryStyles.marginTop;
    }
  }

  /* ===============================
   *  Global API Exposure
   * =============================== */

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
  window.ensureLayoutReferences ??= ensureLayoutReferences;
  window.resetSubtasksSpacing ??= resetSubtasksSpacing;
})();
