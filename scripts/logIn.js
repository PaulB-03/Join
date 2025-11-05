/**
 * Saves the current login status to localStorage.
 *
 * @param {string} userType - The type of user ("user" or "guest").
 * @param {string} [userName=""] - The name of the logged-in user, if available.
 * @returns {void}
 */
function saveLoginStatus(userType, userName = "") {
  localStorage.setItem("currentUser", JSON.stringify({ type: userType, name: userName }));
}

/**
 * Loads the current login status from localStorage.
 *
 * @returns {{type?: string, name?: string}} The current user object,
 * or an empty object if not found or parsing fails.
 */
function loadLoginStatus() {
  try {
    return JSON.parse(localStorage.getItem("currentUser")) || {};
  } catch {
    return {};
  }
}

/**
 * Generates initials for a given name string.
 * Returns "G" if no valid name is provided (for guest users).
 *
 * @param {string} name - The user's name.
 * @returns {string} The uppercase initials of the name, or "G" as a default.
 */
function initials(name) {
  if (!name || typeof name !== "string") return "G";
  const parts = name.trim().replace(/\s+/g, " ").split(" ");
  const letters = parts
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase());
  return letters.length ? letters.join("") : "G";
}

/**
 * Toggles the display property of an element between "flex" and "none".
 *
 * @param {HTMLElement | null} element - The DOM element to show or hide.
 * @param {boolean} shouldShow - Whether to display (true) or hide (false) the element.
 * @returns {void}
 */
function toggleElement(element, shouldShow) {
  if (element) element.style.display = shouldShow ? "flex" : "none";
}

/**
 * Displays the user avatar and hides the guest avatar.
 * Sets the user's initials as the avatar content.
 *
 * @param {HTMLElement | null} userAvatar - The user avatar element.
 * @param {HTMLElement | null} guestAvatar - The guest avatar element.
 * @param {string} name - The user's full name.
 * @returns {void}
 */
function showUserAvatar(userAvatar, guestAvatar, name) {
  if (userAvatar) {
    userAvatar.textContent = initials(name);
  }
  toggleElement(userAvatar, true);
  toggleElement(guestAvatar, false);
}

/**
 * Displays the guest avatar and hides the user avatar.
 *
 * @param {HTMLElement | null} userAvatar - The user avatar element.
 * @param {HTMLElement | null} guestAvatar - The guest avatar element.
 * @returns {void}
 */
function showGuestAvatar(userAvatar, guestAvatar) {
  toggleElement(userAvatar, false);
  toggleElement(guestAvatar, true);
}

/**
 * Updates header avatars based on the current user's login type.
 *
 * @param {{type?: string, name?: string}} [currentUser={}] - The currently logged-in user object.
 * @returns {void}
 */
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

/**
 * Displays a personalized greeting message on the summary page.
 * Shows the user's name or adjusts punctuation for guest users.
 *
 * @returns {void}
 */
function showSummaryGreeting() {
  const currentUser = loadLoginStatus();
  const greetingNameElement = document.querySelector("#logInName");
  const markDestinction = document.getElementById("markDestinction");
  if (!greetingNameElement || !markDestinction) return;

  greetingNameElement.textContent = currentUser.type === "guest" ? "" : currentUser.name || "";
  markDestinction.textContent = greetingNameElement.textContent.length < 1 ? "!" : ",";
}

/**
 * Toggles the visibility of the profile dropdown menu.
 *
 * @param {MouseEvent} e - The click event that triggered the toggle.
 * @returns {void}
 */
function toggleProfileMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById("profileMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

/**
 * Hides the profile menu when clicking outside of it.
 */
document.addEventListener("click", () => {
  const menu = document.getElementById("profileMenu");
  if (menu) menu.style.display = "none";
});

/**
 * Hides the profile menu when the Escape key is pressed.
 */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const menu = document.getElementById("profileMenu");
    if (menu) menu.style.display = "none";
  }
});
