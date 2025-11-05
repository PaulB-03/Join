const BASE_URL = DB_ROOT;

// 1. Check for existing user by email
/**
 * Checks if a user with the given email already exists.
 * Updates the UI with an error if duplicate found.
 * @param {Object|null} users - Existing users object from DB.
 * @param {string} email - Email to check.
 * @returns {boolean} True if user exists, false otherwise.
 */
function checkForUser(users, contacts, email) {
  const emailExistsInUsers = users && Object.values(users).some((u) => u.email === email);
  const emailExistsInContacts = contacts && Object.values(contacts).some((c) => c.email === email);
  if (emailExistsInUsers || emailExistsInContacts) {
    setEmailError("This email address is already used.", true);
    return true;
  }
  setEmailError("Please use a valid email address.", false);
  return false;
}

/**
 * Sets or clears email error state.
 * @param {string} message - Error message.
 * @param {boolean} show - Whether to show error.
 */
function setEmailError(message, show) {
  signupEmail.classList.toggle("input-error", show);
  emailError.style.visibility = show ? "visible" : "hidden";
  emailError.innerHTML = message;
}

// 2. Determine the next index
/**
 * Finds the next available numeric index for a new user.
 * @param {Object|null} users - Existing users object.
 * @returns {number} Next available index.
 */
function checkIndexPosition(users) {
  const keys = users ? Object.keys(users) : [];
  const numbers = keys.map((k) => parseInt(k.replace("user", "")));
  return numbers.length ? Math.max(...numbers) + 1 : 1;
}

// 3. Save new user to database
/**
 * Saves a new user to the backend database.
 * @param {Object} newUser - User object with name/email/password.
 * @param {number} nextIndex - Index for the new user key.
 * @returns {Promise<string|null>} User key if saved, null on error.
 */
async function saveNewUser(newUser, nextIndex) {
  const newKey = `user${nextIndex}`;
  const response = await fetch(`${BASE_URL}/users/${newKey}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newUser),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error saving:", response.status, errorText);
    return null;
  }
  return newKey;
}

// 4. Main function
/**
 * Adds a new user if email is unique and saves to DB.
 * @param {string} name - User's name.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
async function addUser(name, email, password) {
  const phone = "add phone number";
  const newUser = { name, email, password };
  const res = await fetch(`${BASE_URL}/users.json`);
  const users = await res.json();
  const contactCheck = await fetch(`${BASE_URL}/contacts.json`);
  const contacts = await contactCheck.json();
  if (checkForUser(users, contacts, email)) return false;
  const nextIndex = checkIndexPosition(users);
  const newKey = await saveNewUser(newUser, nextIndex);
  if (!newKey) return false;
  await addContact({ name, email, phone });
  return true;
}

/**
 * Shows the signup screen and hides login.
 */
function showSignupScreen() {
  signinForm.reset();
  resetInputErrors("signinForm");
  document.getElementById("loginScreen").classList.add("d_none");
  document.getElementById("showSignUp").classList.add("hidden");
  document.getElementById("showSignUpMobile").classList.add("hidden");
  document.getElementById("signupScreen").classList.remove("d_none");
}

/**
 * Shows the login screen and resets signup form state.
 */
function showLoginScreen() {
  signupForm.reset();
  policyChecked = false;
  document.getElementById("loginScreen").classList.remove("d_none");
  document.getElementById("showSignUp").classList.remove("hidden");
  document.getElementById("showSignUpMobile").classList.remove("hidden");
  document.getElementById("signupScreen").classList.add("d_none");
  document.getElementById("signupOverlay").classList.add("d_none");
  resetSignupErrors();
}

/**
 * Clears signup form errors and hides messages.
 */
function resetSignupErrors() {
  signupForm.querySelectorAll("*").forEach((el) => el.classList.remove("input-error"));
  nameError.style.visibility = "hidden";
  emailError.style.visibility = "hidden";
  passwordMatchError.style.visibility = "hidden";
  policyError.style.visibility = "hidden";
}

// ========== INPUT HANDLERS ==========

/**
 * Attaches behavior to all form inputs (password + text).
 */
function attachInputBehaviors() {
  setupPasswordInput(document.getElementById("signupPassword"));
  setupPasswordInput(document.getElementById("confirmPassword"));
  setupPasswordInput(document.getElementById("signinPassword"));
  removeInputErrorOnInput(document.getElementById("signupName"), nameError);
  removeInputErrorOnInput(document.getElementById("signupEmail"), emailError);
  removeInputErrorOnInput(document.getElementById("signinEmail"));
  removeInputErrorOnInput(document.getElementById("signupPassword"));
  removeInputErrorOnInput(document.getElementById("confirmPassword"), passwordMatchError);
  removeInputErrorOnInput(document.getElementById("signinPassword"), loginError);
}
attachInputBehaviors();

/**
 * Removes input error styles when user types.
 * @param {HTMLElement} input - The input element.
 * @param {HTMLElement} [errorElement] - Optional error message element.
 */
function removeInputErrorOnInput(input, errorElement) {
  input.addEventListener("input", () => {
    if (errorElement) errorElement.style.visibility = "hidden";
    input.classList.remove("input-error");
  });
}

// ========== PASSWORD HANDLING ==========

/**
 * Updates the password input icon depending on value.
 * @param {HTMLInputElement} input - Password input element.
 * @param {{visible: boolean}} state - State of visibility toggle.
 */
function updatePasswordIconOnInput(input, state) {
  input.addEventListener("input", () => {
    if (input.value.trim() === "") resetPasswordIcon(input, state);
    else if (!state.visible) setVisibilityOffIcon(input);
  });
}

/**
 * Toggles password visibility on click of icon area.
 * @param {HTMLInputElement} input - Password input element.
 * @param {{visible: boolean}} state - Visibility state object.
 */
function togglePasswordVisibilityOnClick(input, state) {
  input.addEventListener("click", (e) => {
    const iconAreaClicked = e.offsetX > input.clientWidth - 30;
    if (!iconAreaClicked || input.value.trim() === "") return;
    if (state.visible) hidePassword(input);
    else makePasswordVisible(input);
    state.visible = !state.visible;
  });
  input.addEventListener("mousemove", (e) => {
    const iconArea = e.offsetX > input.clientWidth - 30;
    input.style.cursor = iconArea ? "pointer" : "text";
  });
}

/**
 * Resets icon to lock state and hides password.
 * @param {HTMLInputElement} input - Password input element.
 * @param {{visible: boolean}} state - State of visibility.
 */
function resetPasswordIcon(input, state) {
  input.classList.remove("formVisibilityOffIcon", "formVisibilityIcon");
  input.classList.add("formLockIcon");
  input.type = "password";
  state.visible = false;
}

/**
 * Applies "visibility off" icon.
 * @param {HTMLInputElement} input - Password input element.
 */
function setVisibilityOffIcon(input) {
  input.classList.remove("formLockIcon", "formVisibilityIcon");
  input.classList.add("formVisibilityOffIcon");
}

/**
 * Makes password visible and sets icon.
 * @param {HTMLInputElement} input - Password input element.
 */
function makePasswordVisible(input) {
  input.type = "text";
  input.classList.remove("formVisibilityOffIcon");
  input.classList.add("formVisibilityIcon");
}

/**
 * Hides password and applies "visibility off" icon.
 * @param {HTMLInputElement} input - Password input element.
 */
function hidePassword(input) {
  input.type = "password";
  input.classList.remove("formVisibilityIcon");
  input.classList.add("formVisibilityOffIcon");
}

/**
 * Sets up password field behavior: icon state + toggle.
 * @param {HTMLInputElement} input - Password input element.
 */
function setupPasswordInput(input) {
  const state = { visible: false };
  updatePasswordIconOnInput(input, state);
  togglePasswordVisibilityOnClick(input, state);
}

// ========== SIGNUP BUTTON ENABLE/DISABLE HANDLING ==========

/**
 * Checks if all required signup inputs are filled and policy accepted.
 * @returns {boolean} True if all required fields are valid, false otherwise.
 */
function canSubmitSignup() {
  const name = document.getElementById("signupName")?.value.trim();
  const email = document.getElementById("signupEmail")?.value.trim();
  const p1 = document.getElementById("signupPassword")?.value.trim();
  const p2 = document.getElementById("confirmPassword")?.value.trim();
  const policy = typeof policyChecked !== "undefined" ? policyChecked : false; // reuse global
  return !!(name && email && p1 && p2 && policy);
}

/**
 * Enables or disables the signup button depending on form completion.
 */
function syncSignupBtn() {
  const ok = canSubmitSignup();
  signupBtn.disabled = !ok;
  signupBtn.style.opacity = ok ? "" : "0.5";
  signupBtn.style.cursor = ok ? "" : "not-allowed";
}

/**
 * Attaches input event listeners to form fields.
 */
function setupInputListeners() {
  ["signupName", "signupEmail", "signupPassword", "confirmPassword"].forEach((id) => document.getElementById(id)?.addEventListener("input", syncSignupBtn));
}

/**
 * Attaches click listener to policy checkbox image.
 */
function setupPolicyListener() {
  document.getElementById("policyCheckboxImg")?.addEventListener("click", () => setTimeout(syncSignupBtn, 0));
}

/**
 * Prevents form submission if fields are incomplete.
 */
function setupFormSubmitBlock() {
  (window.signupForm || document.getElementById("signUpForm"))?.addEventListener("submit", (e) => !canSubmitSignup() && e.preventDefault());
}

/**
 * Initializes event listeners for signup form fields and policy checkbox.
 * Disables the signup button when inputs are empty or policy is not accepted.
 */
function initSignupButtonState() {
  setupInputListeners();
  setupPolicyListener();
  setupFormSubmitBlock();
  syncSignupBtn();
}

initSignupButtonState();
