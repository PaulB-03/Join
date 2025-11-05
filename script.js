/**
 * Initializes header and sidebar, sets avatars and active links
 * and shows hidden elements to avoid flicker.
 */
/**
 * Checks whether the user can access the current page and redirects to login if not.
 *
 * @function checkUserAccess
 * @description Redirects unauthenticated users away from private pages, except for explicitly allowed ones.
 * @returns {boolean} Returns `true` if access is allowed, otherwise triggers a redirect.
 */
function checkUserAccess() {
  const PUBLIC_PATHS = new Set(["/", "/index.html", "/html/privacyPolicy.html", "/html/legalNotice.html"]);
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const isPublic = PUBLIC_PATHS.has(path) || document.body?.dataset.public === "true";
  const noUser = !localStorage.getItem("currentUser");

  if (!isPublic && noUser) {
    const exceptions = ["/html/legalNotice.html", "/html/privacyPolicy.html"];
    if (!exceptions.includes(path)) {
      const redirect = path.includes("/html/") ? "../index.html" : "./index.html";
      window.location.href = redirect;
      return false;
    }
  }
  return true;
}

/**
 * Initializes the sidebar header and updates UI components for the logged-in user.
 *
 * @function initSidebarHeader
 * @description Loads the current user session, updates header avatars, highlights active links,
 * and applies initial layout classes.
 * @returns {void}
 */
function initSidebarHeader() {
  if (!checkUserAccess()) return;
  const user = loadLoginStatus();
  updateHeaderAvatars(user);
  highlightActiveLink();
  toggleSidebarAndHeader(user);
  document.querySelector("header").classList.add("header-initialized");
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
  headerNav.classList.add("d_none");
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
  headerNav.classList.remove("d_none");
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
 * Logs the user out of the application.
 *
 * @function logout
 * @description Removes user-related data from local storage to end the current session.
 * @returns {void}
 */
function logout() {
  localStorage.removeItem("showedOnce");
  localStorage.removeItem("currentUser");
}

/**
 * Handles the back navigation arrow behavior.
 *
 * @function backArrow
 * @description Determines where to navigate when the user clicks the "back" button:
 * - If no user is logged in (`currentUser` is missing), redirects to the login page.
 * - Otherwise, navigates to the previous page in browser history.
 *
 * @returns {void}
 */
function backArrow() {
  const noUser = !localStorage.getItem("currentUser");
  if (noUser) {
    window.location.href = "../index.html";
  } else {
    history.back();
  }
}

/**
 * Ensures user logout when navigating back to this page from the browser cache.
 *
 * @event pageshow
 * @description The `pageshow` event is triggered when a page is loaded from cache or directly.
 * If the page is restored from the browser's back/forward cache, it calls {@link logout}.
 *
 * @param {PageTransitionEvent} event - The event object containing navigation information.
 * @listens window#pageshow
 */
window.addEventListener("pageshow", function (event) {
  // event.persisted is true if the page was restored from the cache
  if (event.persisted || performance.getEntriesByType("navigation")[0].type === "back_forward") {
    logout();
  }
});
