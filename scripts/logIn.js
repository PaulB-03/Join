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
    userAvatar.innerHTML = initials(currentUser.name);

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
