async function includeHTML() {
  let includeElements = document.querySelectorAll("[w3-include-html]");
  for (let i = 0; i < includeElements.length; i++) {
    const element = includeElements[i];
    const file = element.getAttribute("w3-include-html");

    try {
      let resp = await fetch(file);
      if (resp.ok) {
        element.innerHTML = await resp.text();
      } else {
        element.innerHTML = "Page not found";
      }
    } catch (e) {
      element.innerHTML = "Error loading include";
    }

    // Klasse entfernen → Sidebar sichtbar machen
    element.classList.remove("d_none");
  }

  // Sidebar-Links hervorheben, wenn geladen
  highlightActiveLink();
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

function showSignupScreen() {
  document.getElementById("loginScreen").classList.add("d_none");
  document.getElementById("indexHeaderRight").classList.add("d_none");
  document.getElementById("signupScreen").classList.remove("d_none");
}

function showLoginScreen() {
  document.getElementById("loginScreen").classList.remove("d_none");
  document.getElementById("indexHeaderRight").classList.remove("d_none");
  document.getElementById("signupScreen").classList.add("d_none");
}
