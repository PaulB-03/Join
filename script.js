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
