function setLoginStatus(type, name = "") {
  localStorage.setItem("currentUser", JSON.stringify({ type, name }));
}

function getLoginStatus() {
  try { return JSON.parse(localStorage.getItem("currentUser")) || {}; }
  catch { return {}; }
}

function toggleHeaderIcons() {
  const u = getLoginStatus();
  const userAv = document.querySelector("#header #userAvatar");
  const guestAv = document.querySelector("#header #guestAvatar");
  const show = (el, on) => { if (el) el.style.display = on ? "flex" : "none"; };
  if (u.type === "user") { show(userAv, true); show(guestAv, false); }
  else if (u.type === "guest") { show(userAv, false); show(guestAv, true); }
  else { show(userAv, false); show(guestAv, false); }
}

function applySummaryGreeting() {
  const u = getLoginStatus();
  const nameEl = document.querySelector(".sumName");
  if (!nameEl) return;
  nameEl.textContent = u.type === "guest" ? "Gast" : (u.name || "");
}

function waitForHeaderAndApply() {
  const ready = document.querySelector("#header #userAvatar, #header #guestAvatar");
  if (ready) toggleHeaderIcons();
  else setTimeout(waitForHeaderAndApply, 50);
}

document.addEventListener("DOMContentLoaded", () => {
  waitForHeaderAndApply(); applySummaryGreeting();

  const L = document.getElementById("loginBtn");
  const G = document.getElementById("guestLogin");
  const A = G?.closest("a");               

  L?.addEventListener("click", (e) => {
    e.preventDefault();
    setLoginStatus("user", "Sofia Müller");
    window.location.href = "./html/summary.html";
  });

  const setG = () => setLoginStatus("guest");
  G?.addEventListener("click", setG);
  A?.addEventListener("click", setG);
});

function toggleProfileMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById("profileMenu");
  menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

// Klick außerhalb → Menü schließen
document.addEventListener("click", () => {
  const menu = document.getElementById("profileMenu");
  if (menu) menu.style.display = "none";
});

// ESC → Menü schließen
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const menu = document.getElementById("profileMenu");
    if (menu) menu.style.display = "none";
  }
});

function logoutUser() {
  localStorage.removeItem("currentUser");
  document.getElementById("profileMenu").style.display = "none";
  window.location.href = "../index.html";
}
