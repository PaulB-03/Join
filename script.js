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

  toggleSidebarAndHeader();
  updateHeaderAvatars();
  highlightActiveLink();
}

function toggleSidebarAndHeader() {
  const currentUser = loadLoginStatus();
  const internalSidebar = document.getElementById("internalSidebar");
  const externalSidebar = document.getElementById("externalSidebar");
  const headerNav = document.getElementById("headerNav");

  if (!internalSidebar || !externalSidebar) return;

  if (!currentUser.type) {
    // storage empty → show external sidebar
    externalSidebar.classList.remove("d_none");
    internalSidebar.classList.add("d_none");
    headerNav.style.visibility = "hidden";
  } else {
    // guest OR user with name → show internal sidebar
    internalSidebar.classList.remove("d_none");
    externalSidebar.classList.add("d_none");
    headerNav.style.visibility = "show";
  }
}

function highlightActiveLink() {
  const currentPath = location.pathname.replace(/\/+$/, "") || "/";

  // Entferne alte Marker
  document.querySelectorAll(".nav-link.active").forEach((el) => el.classList.remove("active"));

  document.querySelectorAll(".nav-link").forEach((link) => {
    // benutze href-Attribut und resolve relativ zum origin
    const href = link.getAttribute("href") || link.href;
    const linkPath = new URL(href, location.origin).pathname.replace(/\/+$/, "") || "/";
    if (linkPath === currentPath) {
      link.classList.add("active");
    }
  });
}
(function enableDropzoneDragScrollSafe() {
  const THRESHOLD = 6; // erst ab 6px Bewegung wird gescrollt (darunter: normaler Klick/Drag)

  function isInteractive(el) {
    // Alles, worauf ein „echter“ Klick/Drag gehen könnte (Buttons, Inputs, Links etc.)
    return !!el.closest('button, a, input, textarea, select, [contenteditable=""], .add-card-btn');
  }

  function isCard(el) {
    return !!el.closest('.card, .task-container');
  }

  document.querySelectorAll('.dropzone').forEach((zone) => {
    let isMouseDown = false;
    let isScrolling = false;
    let startX = 0;
    let startScrollLeft = 0;
    let originTarget = null;

    zone.addEventListener('mousedown', (e) => {
      // Nur linke Maustaste
      if (e.button !== 0) return;

      originTarget = e.target;

      // NICHT scrollen, wenn auf Karte oder interaktivem Element geklickt wurde → DnD darf übernehmen
      if (isCard(originTarget) || isInteractive(originTarget)) {
        isMouseDown = false;
        isScrolling = false;
        return;
      }

      isMouseDown = true;
      isScrolling = false; // wird erst nach THRESHOLD aktiv
      startX = e.clientX;
      startScrollLeft = zone.scrollLeft;
    });

    // Wichtig: Nur wenn wir wirklich scrollen, unterdrücken wir Clicks
    function maybeSuppressClickOnce() {
      if (!isScrolling) return;
      const suppress = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      zone.addEventListener('click', suppress, { capture: true, once: true });
    }

    zone.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;

      const dx = e.clientX - startX;

      // Noch unterhalb des Schwellwerts? Nichts tun → lässt DnD/Klick zu
      if (!isScrolling && Math.abs(dx) < THRESHOLD) return;

      // Ab hier sind wir im „scroll“-Modus
      if (!isScrolling) {
        isScrolling = true;
        zone.classList.add('drag-scroll');
      }

      // Jetzt aktiv Scrollen und Default nur im Scroll-Modus verhindern
      e.preventDefault();
      zone.scrollLeft = startScrollLeft - dx;
    });

    function endDrag() {
      if (isMouseDown) {
        maybeSuppressClickOnce(); // verhindert "Geisterklick", aber nur wenn gescrollt wurde
      }
      isMouseDown = false;
      isScrolling = false;
      zone.classList.remove('drag-scroll');
      originTarget = null;
    }

    zone.addEventListener('mouseup', endDrag);
    zone.addEventListener('mouseleave', endDrag);

    // Falls irgendwo außerhalb losgelassen wird
    document.addEventListener('mouseup', endDrag, { capture: true });
  });
})();