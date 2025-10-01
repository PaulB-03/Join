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

function initials(name) {
  if (!name || typeof name !== "string") return "G"; 
  const parts = name.trim().replace(/\s+/g, " ").split(" ");
  const letters = parts
    .filter(Boolean)
    .slice(0, 2)                  
    .map(p => p.charAt(0).toUpperCase());
  return letters.length ? letters.join("") : "G";
}

function toggleElement(element, shouldShow) {
  if (element) element.style.display = shouldShow ? "flex" : "none";
}

function showUserAvatar(userAvatar, guestAvatar, name) {
  if (userAvatar) {
    userAvatar.textContent = initials(name); 
  }
  toggleElement(userAvatar, true);
  toggleElement(guestAvatar, false);
}

function showGuestAvatar(userAvatar, guestAvatar) {
  toggleElement(userAvatar, false);
  toggleElement(guestAvatar, true);
}

function updateHeaderAvatars(currentUser = {}) {
  const userAvatar = document.getElementById("userAvatar");
  const guestAvatar = document.getElementById("guestAvatar");

  const type = currentUser.type || ""; 
  if (type === "user") {
    showUserAvatar(userAvatar, guestAvatar, currentUser.name || "");
  } else if (type === "guest") {
    showGuestAvatar(userAvatar, guestAvatar);
  } else {
    toggleElement(userAvatar, false);
    toggleElement(guestAvatar, false);
  }
}

function showSummaryGreeting() {
  const currentUser = loadLoginStatus();
  const greetingNameElement = document.querySelector("#logInName");
  const markDestinction = document.getElementById("markDestinction");
  if (!greetingNameElement || !markDestinction) return;

  greetingNameElement.textContent = currentUser.type === "guest" ? "" : (currentUser.name || "");
  markDestinction.textContent = greetingNameElement.textContent.length < 1 ? "!" : ",";
}

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

// function logoutUser() {
//   localStorage.removeItem("showedOnce");
//   localStorage.removeItem("currentUser");
//   document.getElementById("profileMenu").style.display = "none";
//   window.location.href = "../index.html";
// }
