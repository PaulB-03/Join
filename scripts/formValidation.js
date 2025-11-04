/**
 * @fileoverview Handles sign-up form validation, user registration process,
 * and policy agreement logic for a web app. Includes real-time field validation
 * and visual feedback for users.
 */

/* ─────────────── Regex Patterns ─────────────── */

/**
 * Validates full names with support for accented characters, spaces, hyphens, and apostrophes.
 * Must include at least two words.
 * @type {RegExp}
 */
const nameRegex = /^[a-zA-ZÀ-ÖØ-öø-ÿß'-]{1,12}(?:\s+[a-zA-ZÀ-ÖØ-öø-ÿß'-]{1,12})+$/;

/**
 * Validates standard email addresses.
 * @type {RegExp}
 */
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$/;

/* ─────────────── DOM References ─────────────── */

/** @type {HTMLFormElement | null} */
const signupForm = document.getElementById("signUpForm");
/** @type {HTMLFormElement | null} */
const signinForm = document.getElementById("signinForm");

const signinEmail = document.getElementById("signinEmail")?.value.toLowerCase();
const loginError = document.getElementById("loginError");
/** @type {HTMLInputElement | null} */
const signinPassword = document.getElementById("signinPassword");

const signupName = document.getElementById("signupName");
const nameError = document.getElementById("nameError");

const signupEmail = document.getElementById("signupEmail");
const emailError = document.getElementById("emailError");

const signupPassword = document.getElementById("signupPassword");
const confirmPassword = document.getElementById("confirmPassword");
const passwordMatchError = document.getElementById("passwordMatchError");

const acceptPolicy = document.getElementById("acceptPolicy");
const policyError = document.getElementById("policyError");
const acceptPolicyImg = document.getElementById("policyCheckboxImg");

/**
 * Tracks whether the privacy policy has been accepted.
 * @type {boolean}
 */
let policyChecked = false;

/* ─────────────── Helper Functions ─────────────── */

/**
 * Updates visibility and styling of a field's error message based on validation result.
 *
 * @param {boolean} isValid - Whether the field input is valid.
 * @param {HTMLElement} inputElement - The input field element to toggle the error class on.
 * @param {HTMLElement} errorElement - The element displaying the validation message.
 * @returns {void}
 */
const updateFieldError = (isValid, inputElement, errorElement) => {
  errorElement.style.visibility = isValid ? "hidden" : "visible";
  inputElement.classList.toggle("input-error", !isValid);
};

/**
 * Validates the sign-up form fields for name, email, password match, and policy acceptance.
 * Displays error messages and updates input states accordingly.
 *
 * @returns {boolean} True if all fields are valid and the policy is accepted, otherwise false.
 */
const validateSignupForm = () => {
  const isNameValid = nameRegex.test(signupName.value);
  const isEmailValid = emailRegex.test(signupEmail.value.toLowerCase());
  const doPasswordsMatch = signupPassword.value && signupPassword.value === confirmPassword.value;
  updateFieldError(isNameValid, signupName, nameError);
  updateFieldError(isEmailValid, signupEmail, emailError);
  updateFieldError(doPasswordsMatch, signupPassword, passwordMatchError);
  updateFieldError(doPasswordsMatch, confirmPassword, passwordMatchError);
  // Check policy acceptance
  policyError.style.visibility = policyChecked ? "hidden" : "visible";

  return isNameValid && isEmailValid && doPasswordsMatch && policyChecked;
};

/* ─────────────── Event Listeners ─────────────── */

/**
 * Toggles the checkbox image and state when the policy icon is clicked.
 * Updates error visibility immediately.
 */
acceptPolicyImg.addEventListener("click", () => {
  policyChecked = !policyChecked;
  acceptPolicyImg.src = policyChecked ? "./assets/svg/checked.svg" : "./assets/svg/checkbox.svg";
  policyError.style.visibility = policyChecked ? "hidden" : "visible";
});

/**
 * Handles form submission for user sign-up.
 * Validates the form, and if valid, calls {@link signupProcess}.
 *
 * @async
 * @param {SubmitEvent} e - The submit event from the sign-up form.
 * @returns {Promise<void>}
 */
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateSignupForm()) return;
  const name = signupName.value;
  const email = signupEmail.value.toLowerCase();
  const password = signupPassword.value;
  try {
    await signupProcess(name, email, password);
  } catch (err) {
    console.error("Signup failed:", err);
  }
});

/* ─────────────── Signup Process ─────────────── */

/**
 * Handles the asynchronous sign-up process.
 * Adds the new user, shows success feedback, and resets the form.
 *
 * @async
 * @param {string} name - The user's full name.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<void>}
 */
async function signupProcess(name, email, password) {
  const success = await addUser(name, email, password);
  if (!success) {
    return; // Stop on failure
  }
  // Success flow
  showSignupSuccess();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  signupForm.reset();
  resetInputErrors("signUpForm");
  policyChecked = false;
  acceptPolicyImg.src = "./assets/svg/checkbox.svg";
  showLoginScreen();
}

/**
 * Displays the "Sign-Up Success" overlay with animation.
 * Forces reflow to ensure the CSS transition triggers.
 *
 * @returns {void}
 */
function showSignupSuccess() {
  const overlay = document.getElementById("signupOverlay");
  overlay.classList.remove("d_none");
  void overlay.offsetWidth; // Force reflow for CSS animation
  overlay.classList.add("show");
}

function resetInputErrors(id) {
  const container = document.getElementById(id);
  if (!container) return;

  // Remove input-error class from inputs
  const errorInputs = container.querySelectorAll(".input-error");
  errorInputs.forEach((input) => input.classList.remove("input-error"));

  // Hide all error message elements
  const errorMessages = container.querySelectorAll(".errors");
  errorMessages.forEach((el) => {
    el.style.visibility = "hidden";
  });
}
