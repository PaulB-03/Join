/**
 * Initializes the sidebar and header behavior on page load.
 * - Redirects guests away from internal pages.
 * - Loads and applies the correct sidebar (internal/external).
 * - Updates header avatars and highlights the active link.
 *
 * @function sidebarHeaderInit
 * @returns {void}
 */
function sidebarHeaderInit() {
  /** @const {Set<string>} Public routes accessible without login */
  const PUB = new Set(["/", "/index.html", "/html/privacyPolicy.html", "/html/legalNotice.html"]);

  /** @type {string} Normalized current path */
  const path = location.pathname.replace(/\/+$/, "") || "/";

  /** @type {boolean} True if the current page is public */
  const isPub = PUB.has(path) || document.body?.dataset.public === "true";

  /** @type {boolean} True if no user is stored in localStorage */
  const noUser = !localStorage.getItem("currentUser");

  // Redirect guests away from internal routes
  if (!isPub && noUser) {
    const exc = ["/Join/html/legalNotice.html", "/Join/html/privacyPolicy.html"];
    if (!exc.includes(path)) {
      const toIndex = path.includes("/html/") ? "../index.html" : "./index.html";
      return (window.location.href = toIndex);
    }
  }

  // Load user and set up interface
  const user = loadLoginStatus();
  updateHeaderAvatars(user);
  highlightActiveLink();
  toggleSidebarAndHeader(user);
}

/**
 * Retrieves the current user from localStorage safely.
 * @function getCurrentUser
 * @returns {Record<string, any>} Parsed user object or empty object.
 */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "{}");
  } catch {
    return {};
  }
}

/**
 * Switches between internal (logged-in) and external (guest) sidebar layouts.
 * @function toggleSidebarAndHeader
 * @param {Record<string, any>} user - User object, if available.
 * @returns {void}
 */
function toggleSidebarAndHeader(user) {
  const internal = document.getElementById("internalSidebar");
  const external = document.getElementById("externalSidebar");
  const headerNav = document.getElementById("headerNav");

  if (!internal || !external || !headerNav) return;

  const u = user ?? getCurrentUser();
  if (!u.type) showExternalSidebar(external, internal, headerNav);
  else showInternalSidebar(external, internal, headerNav);
}

/**
 * Displays the external (public) sidebar and hides the internal one.
 * Also hides the header navigation for guests.
 *
 * @function showExternalSidebar
 * @param {HTMLElement} external - External sidebar element.
 * @param {HTMLElement} internal - Internal sidebar element.
 * @param {HTMLElement} headerNav - Header navigation element.
 * @returns {void}
 */
function showExternalSidebar(external, internal, headerNav) {
  external.classList.remove("d_none");
  internal.classList.add("d_none");
  headerNav.style.visibility = "hidden";
}

/**
 * Displays the internal sidebar (for logged-in users) and hides the external one.
 * Also shows the header navigation.
 *
 * @function showInternalSidebar
 * @param {HTMLElement} external - External sidebar element.
 * @param {HTMLElement} internal - Internal sidebar element.
 * @param {HTMLElement} headerNav - Header navigation element.
 * @returns {void}
 */
function showInternalSidebar(external, internal, headerNav) {
  internal.classList.remove("d_none");
  external.classList.add("d_none");
  headerNav.style.visibility = "visible";
}

/**
 * Highlights the currently active link in the navigation.
 * - Removes previous 'active' classes.
 * - Compares normalized link paths with the current URL.
 *
 * @function highlightActiveLink
 * @returns {void}
 */
function highlightActiveLink() {
  let currentPath = location.pathname.replace(/\/+$/, "") || "/";
  currentPath = currentPath.replace(/^\/Join/, "") || "/";

  document.querySelectorAll(".nav-link.active").forEach((el) => el.classList.remove("active"));

  document.querySelectorAll(".nav-link").forEach((link) => {
    const href = link.getAttribute("href") || link.href;
    const linkPath = new URL(href, location.origin).pathname.replace(/\/+$/, "") || "/";
    if (linkPath === currentPath) {
      link.classList.add("active");
    }
  });
}

/**
 * Self-invoking function that enables safe horizontal drag-scrolling
 * for all elements with the class `.dropzone`.
 *
 * Features:
 * - Prevents scroll interference with interactive elements (buttons, links, inputs).
 * - Ignores draggable card elements.
 * - Suppresses accidental clicks after a scroll drag.
 * - Minimal overhead, no dependencies.
 *
 * @function enableDropzoneDragScrollSafe
 * @returns {void}
 */
(function enableDropzoneDragScrollSafe() {
  /** @constant {number} THRESHOLD - Minimum drag distance before scroll activates. */
  const THRESHOLD = 6;

  /**
   * Checks if an element is interactive (e.g. button, link, input).
   * @param {HTMLElement} el - The element to check.
   * @returns {boolean} True if interactive.
   */
  function isInteractive(el) {
    return !!el.closest('button, a, input, textarea, select, [contenteditable=""], .add-card-btn');
  }

  /**
   * Checks if an element belongs to a draggable card/task.
   * @param {HTMLElement} el - The element to check.
   * @returns {boolean} True if part of a card.
   */
  function isCard(el) {
    return !!el.closest(".card, .task-container");
  }

  // Apply drag-scroll to all dropzones
  document.querySelectorAll(".dropzone").forEach((zone) => {
    let isMouseDown = false;
    let isScrolling = false;
    let startX = 0;
    let startScrollLeft = 0;
    let originTarget = null;

    zone.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      originTarget = e.target;

      if (isCard(originTarget) || isInteractive(originTarget)) {
        isMouseDown = false;
        isScrolling = false;
        return;
      }

      isMouseDown = true;
      isScrolling = false;
      startX = e.clientX;
      startScrollLeft = zone.scrollLeft;
    });

    /**
     * Suppresses a click event after a drag to prevent accidental activation.
     * @returns {void}
     */
    function maybeSuppressClickOnce() {
      if (!isScrolling) return;
      const suppress = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      zone.addEventListener("click", suppress, { capture: true, once: true });
    }

    zone.addEventListener("mousemove", (e) => {
      if (!isMouseDown) return;

      const dx = e.clientX - startX;
      if (!isScrolling && Math.abs(dx) < THRESHOLD) return;

      if (!isScrolling) {
        isScrolling = true;
        zone.classList.add("drag-scroll");
      }

      e.preventDefault();
      zone.scrollLeft = startScrollLeft - dx;
    });

    /**
     * Ends drag-scroll mode and resets internal state.
     * @returns {void}
     */
    function endDrag() {
      if (isMouseDown) maybeSuppressClickOnce();
      isMouseDown = false;
      isScrolling = false;
      zone.classList.remove("drag-scroll");
      originTarget = null;
    }

    zone.addEventListener("mouseup", endDrag);
    zone.addEventListener("mouseleave", endDrag);
    document.addEventListener("mouseup", endDrag, { capture: true });
  });
})();
