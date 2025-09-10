function saveLoginStatus(userType, userName = "") {
  localStorage.setItem("currentUser", JSON.stringify({ type: userType, name: userName }));
}

function loadLoginStatus() {
  try {
    return JSON.parse(localStorage.getItem("currentUser")) || {};
  } catch {
    return {};
  }
}

function updateHeaderAvatars() {
  const currentUser = loadLoginStatus();
  const userAvatar = document.querySelector("#header #userAvatar");
  const guestAvatar = document.querySelector("#header #guestAvatar");

  const toggleElement = (element, shouldShow) => {
    if (element) element.style.display = shouldShow ? "flex" : "none";
  };

  if (currentUser.type === "user") {
    userAvatar.innerHTML = initials(currentUser);

    toggleElement(userAvatar, true);
    toggleElement(guestAvatar, false);
  } else if (currentUser.type === "guest") {
    toggleElement(userAvatar, false);
    toggleElement(guestAvatar, true);
  } else {
    toggleElement(userAvatar, false);
    toggleElement(guestAvatar, false);
  }
}

function initials(name) {
  // Accepts either a string or an object with a 'name' property
  if (typeof name === "object" && name !== null && "name" in name) {
    name = name.name;
  }
  const parts = (name || "").trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function showSummaryGreeting() {
  const currentUser = loadLoginStatus();
  const greetingNameElement = document.querySelector("#logInName");
  let markDestinction = document.getElementById("markDestinction");
  if (!greetingNameElement) return;

  greetingNameElement.innerHTML = currentUser.type === "guest" ? "" : currentUser.name || "";
  if (greetingNameElement.innerHTML.length < 1) {
    // changed from original
    markDestinction.innerHTML = "!";
  } else {
    markDestinction.innerHTML = ",";
  }
}

function waitForHeaderAndUpdateAvatars() {
  const headerReady = document.querySelector("#header #userAvatar, #header #guestAvatar");
  if (headerReady) {
    updateHeaderAvatars();
  } else {
    setTimeout(waitForHeaderAndUpdateAvatars, 50);
  }
}

// document.addEventListener("DOMContentLoaded", () => {
//   waitForHeaderAndUpdateAvatars();
//   showSummaryGreeting();
//
//   const loginButton = document.getElementById("loginBtn");
//
//   loginButton?.addEventListener("click", (e) => {
//     e.preventDefault();
//     saveLoginStatus("user", "Sofia Müller");
//     window.location.href = "./html/summary.html";
//   });
// });

function toggleProfileMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById("profileMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

document.addEventListener("click", () => {
  const menu = document.getElementById("profileMenu");
  if (menu) menu.style.display = "none";
});

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
