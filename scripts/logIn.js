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

function showSummaryGreeting() {
  const currentUser = loadLoginStatus();
  const greetingNameElement = document.querySelector(".sumName");
  if (!greetingNameElement) return;

  greetingNameElement.textContent =
    currentUser.type === "guest" ? "" : (currentUser.name || "");
}

function waitForHeaderAndUpdateAvatars() {
  const headerReady = document.querySelector("#header #userAvatar, #header #guestAvatar");
  if (headerReady) {
    updateHeaderAvatars();
  } else {
    setTimeout(waitForHeaderAndUpdateAvatars, 50);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  waitForHeaderAndUpdateAvatars();
  showSummaryGreeting();

  const loginButton = document.getElementById("loginBtn");
  const guestLoginButton = document.getElementById("guestLogin");
  const guestLoginLink = guestLoginButton?.closest("a");

  loginButton?.addEventListener("click", (e) => {
    e.preventDefault();
    saveLoginStatus("user", "Sofia Müller");
    window.location.href = "./html/summary.html";
  });

  const activateGuestLogin = () => saveLoginStatus("guest");

  guestLoginButton?.addEventListener("click", activateGuestLogin);
  guestLoginLink?.addEventListener("click", activateGuestLogin);
});


function toggleProfileMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById("profileMenu");
  menu.style.display = (menu.style.display === "block") ? "none" : "block";
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
