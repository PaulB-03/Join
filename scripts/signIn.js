const guestLoginButton = document.getElementById("guestLogin");

/**
 * Adds a click event listener for guest login.
 * Logs in as a guest, saves the login status, and redirects to the summary page.
 *
 * @param {MouseEvent} e - The click event object.
 * @returns {void}
 */
guestLoginButton?.addEventListener("click", (e) => {
  e.preventDefault(); // Prevent default <a> navigation if needed
  saveLoginStatus("guest");
  window.location.href = "./html/summary.html";
});

/**
 * Adds an event listener for the sign-in form submission.
 * Triggers the user sign-in process.
 */
document.getElementById("signinForm").addEventListener("submit", handleSignIn);

/**
 * Handles the sign-in process.
 * Prevents the default form submission, retrieves credentials,
 * fetches user data, validates the user, and handles the result.
 *
 * @async
 * @param {Event} event - The submit event from the sign-in form.
 * @returns {Promise<void>}
 */
async function handleSignIn(event) {
  event.preventDefault();
  const { email, password } = getSigninFormData();
  try {
    const users = await fetchUsers();
    const foundUser = findUser(users, email, password);
    handleLoginResult(foundUser);
  } catch (error) {
    handleLoginError(error);
  }
}

/**
 * Retrieves the user's email and password from the sign-in form fields.
 *
 * @returns {{ email: string, password: string }} An object containing the email and password.
 */
function getSigninFormData() {
  const email = document.getElementById("signinEmail").value.toLowerCase();
  const password = document.getElementById("signinPassword").value.trim();
  return { email, password };
}

/**
 * Fetches user data from the Firebase Realtime Database.
 *
 * @async
 * @returns {Promise<Object>} A Promise that resolves to the user data object.
 * @throws {Error} Throws an error if no users are found or if the fetch request fails.
 */
async function fetchUsers() {
  const res = await fetch(`${DB_ROOT}/users.json`);
  const data = await res.json();
  if (!data) throw new Error("No users found!");
  return data;
}

/**
 * Finds a user in the fetched user data that matches the provided email and password.
 *
 * @param {Object} users - An object containing all registered users.
 * @param {string} email - The email address entered by the user.
 * @param {string} password - The password entered by the user.
 * @returns {Object|null} Returns the user object if found, otherwise null.
 */
function findUser(users, email, password) {
  for (const key in users) {
    const user = users[key];
    if (user.email === email && user.password === password) {
      return user;
    }
  }
  return null;
}

/**
 * Handles the result of the login attempt.
 * If the user is found, saves the login status and redirects to the summary page.
 * Otherwise, displays an error message.
 *
 * @param {Object|null} foundUser - The found user object or null if no match.
 * @returns {void}
 */
function handleLoginResult(foundUser) {
  if (foundUser) {
    saveLoginStatus("user", foundUser.name);
    window.location.href = "./html/summary.html";
  } else {
    showLoginError();
  }
}

/**
 * Handles unexpected errors during the login process.
 * Logs the error and displays an error message.
 *
 * @param {Error} error - The caught error object.
 * @returns {void}
 */
function handleLoginError(error) {
  console.error("Error during log in:", error);
  showLoginError();
}

/**
 * Displays a visual login error message and highlights invalid input fields.
 *
 * @returns {void}
 */
function showLoginError() {
  const loginError = document.getElementById("loginError");
  if (loginError) loginError.style.visibility = "visible";
  document.getElementById("signinEmail").classList.add("input-error");
  document.getElementById("signinPassword").classList.add("input-error");
}
