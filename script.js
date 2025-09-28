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

function sidebarHeaderInit() {
  if (!localStorage.getItem("currentUser")) {
    window.location.href = "../index.html";
    return; // stop execution
  }
  const currentUser = loadLoginStatus();
  updateHeaderAvatars(currentUser);
  highlightActiveLink();
  toggleSidebarAndHeader(currentUser);
}

function toggleSidebarAndHeader() {
  const internalSidebar = document.getElementById("internalSidebar");
  const externalSidebar = document.getElementById("externalSidebar");
  const headerNav = document.getElementById("headerNav");
  if (!internalSidebar || !externalSidebar) return;
  if (!currentUser.type) {
    showExternalSidebar(externalSidebar, internalSidebar, headerNav);
  } else {
    showInternalSidebar(externalSidebar, internalSidebar, headerNav);
  }
}

function showExternalSidebar(externalSidebar, internalSidebar, headerNav) {
  // storage empty → show external sidebar
  externalSidebar.classList.remove("d_none");
  internalSidebar.classList.add("d_none");
  headerNav.style.visibility = "hidden";
}

function showInternalSidebar(externalSidebar, internalSidebar, headerNav) {
  // guest OR user with name → show internal sidebar
  internalSidebar.classList.remove("d_none");
  externalSidebar.classList.add("d_none");
  headerNav.style.visibility = "show";
}

function highlightActiveLink() {
  const currentPath = location.pathname.replace(/\/+$/, "") || "/";
  document.querySelectorAll(".nav-link.active").forEach((el) => el.classList.remove("active"));

  document.querySelectorAll(".nav-link").forEach((link) => {
    const href = link.getAttribute("href") || link.href;
    const linkPath = new URL(href, location.origin).pathname.replace(/\/+$/, "") || "/";
    if (linkPath === currentPath) {
      link.classList.add("active");
    }
  });
}

(function enableDropzoneDragScrollSafe() {
  const THRESHOLD = 6;

  function isInteractive(el) {
    return !!el.closest('button, a, input, textarea, select, [contenteditable=""], .add-card-btn');
  }

  function isCard(el) {
    return !!el.closest(".card, .task-container");
  }

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

    function endDrag() {
      if (isMouseDown) {
        maybeSuppressClickOnce();
      }
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
