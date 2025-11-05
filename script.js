document.addEventListener("DOMContentLoaded", () => {
  sidebarHeaderInit();
});

/**
 * Initializes header and sidebar, sets avatars and active links
 * and shows hidden elements to avoid flicker.
 */
function sidebarHeaderInit() {
  const PUB = new Set(["/", "/index.html", "/html/privacyPolicy.html", "/html/legalNotice.html"]);
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const isPub = PUB.has(path) || document.body?.dataset.public === "true";
  const noUser = !localStorage.getItem("currentUser");
  if (!isPub && noUser) {
    const exc = ["/html/legalNotice.html", "/html/privacyPolicy.html"];
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

  // Show avatars and helper after initialization
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

function logout() {
  localStorage.removeItem("showedOnce");
  localStorage.removeItem("currentUser");
}

function backArrow() {
  const noUser = !localStorage.getItem("currentUser");
  if (noUser) {
    window.location.href = "../index.html";
  } else {
    history.back();
  }
}
