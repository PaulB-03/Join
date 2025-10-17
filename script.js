//async function includeHTML() {
//  let includeElements = document.querySelectorAll("[w3-include-html]");
//  for (let i = 0; i < includeElements.length; i++) {
//    const element = includeElements[i];
//    const file = element.getAttribute("w3-include-html");
//
//    try {
//      let resp = await fetch(file);
//      if (resp.ok) {
//        element.innerHTML = await resp.text();
//      } else {
//        element.innerHTML = "Page not found";
//      }
//    } catch (e) {
//      element.innerHTML = "Error loading include";
//    }
//
//    element.classList.remove("d_none");
//  }
//
//  // show the correct sidebar based on login status
//  toggleSidebarAndHeader();
//
//  waitForHeaderAndUpdateAvatars();
//
//  // keep your existing link highlight
//  highlightActiveLink();
//}

/**
 * Initializes sidebar and header behavior when the page loads.
 * - Checks if the current page is public.
 * - Redirects unauthorized users back to the start page.
 * - Loads user login status and updates UI accordingly.
 * - Highlights the active navigation link.
 * - Toggles between internal (logged-in) and external (guest) sidebar layouts.
 */
function sidebarHeaderInit() {
  // Define all public routes that can be accessed without login
  const PUB = new Set(["/", "/index.html", "/html/privacyPolicy.html", "/html/legalNotice.html"]);

  // Normalize the path: remove trailing slashes, use "/" for root
  const path = location.pathname.replace(/\/+$/, "") || "/";

  // Determine if the current page is public
  const isPub = PUB.has(path) || document.body?.dataset.public === "true";

  // Check if no user is stored in localStorage
  const noUser = !localStorage.getItem("currentUser");

  // If the page is NOT public and there’s no logged-in user:
  if (!isPub && noUser) {
    // Define exception pages that should remain accessible
    const exc = ["/Join/html/legalNotice.html", "/Join/html/privacyPolicy.html"];

    // If the current path is not an exception, redirect to the index page
    if (!exc.includes(path)) {
      // Determine the correct index path depending on directory structure
      const toIndex = path.includes("/html/") ? "../index.html" : "./index.html";
      return (window.location.href = toIndex);
    }
  }

  // From here on, the user is either logged in or on a public/exception page
  const user = loadLoginStatus();        // Custom function: load user status object
  updateHeaderAvatars(user);             // Custom function: set avatar/profile in header
  highlightActiveLink();                 // Highlight the currently active nav link
  toggleSidebarAndHeader(user);          // Switch between internal/external sidebar
}

/**
 * Retrieves the current user from localStorage safely.
 * - Returns an empty object if parsing fails or no user exists.
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
 * - Internal: used for authenticated users.
 * - External: shown to guests or visitors.
 */
function toggleSidebarAndHeader(user) {
  // Fetch necessary DOM elements
  const internal = document.getElementById("internalSidebar");
  const external = document.getElementById("externalSidebar");
  const headerNav = document.getElementById("headerNav");

  // Exit early if essential elements are missing
  if (!internal || !external || !headerNav) return;

  // Use passed-in user or fallback to localStorage
  const u = user ?? getCurrentUser();

  // If user type is undefined → guest mode, else → internal view
  if (!u.type) showExternalSidebar(external, internal, headerNav);
  else showInternalSidebar(external, internal, headerNav);
}

/**
 * Displays the external (public) sidebar and hides the internal one.
 * Also hides the header navigation for guests.
 */
function showExternalSidebar(external, internal, headerNav) {
  external.classList.remove("d_none");   // Make external sidebar visible
  internal.classList.add("d_none");      // Hide internal sidebar
  headerNav.style.visibility = "hidden"; // Hide header navigation
}

/**
 * Displays the internal sidebar (for logged-in users)
 * and hides the external one. The header nav becomes visible.
 */
function showInternalSidebar(external, internal, headerNav) {
  internal.classList.remove("d_none");   // Show internal sidebar
  external.classList.add("d_none");      // Hide external sidebar
  headerNav.style.visibility = "visible"; // Show header navigation
}

/**
 * Highlights the currently active link in the navigation.
 * - Removes existing 'active' classes.
 * - Compares normalized link paths to the current URL path.
 */
function highlightActiveLink() {
  // Normalize the current path (remove trailing or duplicate slashes)
  const currentPath = location.pathname.replace(/\/+$/, "") || "/";

  // Remove previous active link markings
  document.querySelectorAll(".nav-link.active").forEach((el) => el.classList.remove("active"));

  // Loop through all navigation links
  document.querySelectorAll(".nav-link").forEach((link) => {
    // Get href (handle both relative and absolute paths)
    const href = link.getAttribute("href") || link.href;
    const linkPath = new URL(href, location.origin).pathname.replace(/\/+$/, "") || "/";

    // Compare normalized paths — add 'active' if it matches current URL
    if (linkPath === currentPath) {
      link.classList.add("active");
    }
  });
}

/**
 * Self-invoking function:
 * Enables smooth horizontal drag-scrolling for elements with class .dropzone,
 * while preventing interference with interactive elements (buttons, links, etc.).
 *
 * This is a clean, classic event-driven solution — no dependencies, minimal overhead.
 */
(function enableDropzoneDragScrollSafe() {
  // Minimum mouse movement (in pixels) before scroll mode activates
  const THRESHOLD = 6;

  /**
   * Checks if an element is interactive (e.g., button, link, input).
   * Drag scrolling should NOT block interactions on such elements.
   */
  function isInteractive(el) {
    return !!el.closest('button, a, input, textarea, select, [contenteditable=""], .add-card-btn');
  }

  /**
   * Checks if the event target is part of a card/task element.
   * Drag-scrolling should not trigger on draggable task cards.
   */
  function isCard(el) {
    return !!el.closest(".card, .task-container");
  }

  // Apply the drag-scroll behavior to all elements with class .dropzone
  document.querySelectorAll(".dropzone").forEach((zone) => {
    // Internal state variables for drag-scroll behavior
    let isMouseDown = false;   // Is the left mouse button held down?
    let isScrolling = false;   // Are we currently scrolling?
    let startX = 0;            // Initial mouse X position
    let startScrollLeft = 0;   // Scroll position at drag start
    let originTarget = null;   // Original element that was clicked

    // Mouse down: prepare potential scroll
    zone.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; // Only react to left-click

      originTarget = e.target;

      // Ignore clicks on interactive elements or cards
      if (isCard(originTarget) || isInteractive(originTarget)) {
        isMouseDown = false;
        isScrolling = false;
        return;
      }

      // Otherwise, enable scroll mode
      isMouseDown = true;
      isScrolling = false;
      startX = e.clientX;
      startScrollLeft = zone.scrollLeft;
    });

    /**
     * Suppresses one click event if a drag scroll just occurred.
     * This prevents accidental clicks after scrolling.
     */
    function maybeSuppressClickOnce() {
      if (!isScrolling) return;
      const suppress = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      zone.addEventListener("click", suppress, { capture: true, once: true });
    }

    // Mouse move: handle drag-scroll behavior
    zone.addEventListener("mousemove", (e) => {
      if (!isMouseDown) return;

      const dx = e.clientX - startX;

      // Don’t start scrolling until threshold is passed (avoid jitter)
      if (!isScrolling && Math.abs(dx) < THRESHOLD) return;

      // Activate scrolling mode
      if (!isScrolling) {
        isScrolling = true;
        zone.classList.add("drag-scroll");
      }

      // Prevent text selection or other default actions
      e.preventDefault();

      // Scroll the container by the drag distance
      zone.scrollLeft = startScrollLeft - dx;
    });

    // Ends drag-scroll mode when mouse is released or leaves the zone
    function endDrag() {
      if (isMouseDown) {
        maybeSuppressClickOnce();
      }
      isMouseDown = false;
      isScrolling = false;
      zone.classList.remove("drag-scroll");
      originTarget = null;
    }

    // End drag on mouseup or when leaving the element/document
    zone.addEventListener("mouseup", endDrag);
    zone.addEventListener("mouseleave", endDrag);
    document.addEventListener("mouseup", endDrag, { capture: true });
  });
})();
