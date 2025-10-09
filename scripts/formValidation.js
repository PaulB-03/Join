// regex patterns
const nameRegex = /^[a-zA-ZÀ-ÖØ-öø-ÿß\s'-]+(?:\s+[a-zA-ZÀ-ÖØ-öø-ÿß\s'-]+)+$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// references
const signupForm = document.getElementById("signUpForm");
const signinForm = document.getElementById("signinForm");

const signinEmail = document.getElementById("signinEmail").value.toLowerCase();
const loginError = document.getElementById("loginError");
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

let policyChecked = false;

// Helper function: updates visibility + error class
const updateFieldError = (isValid, inputElement, errorElement) => {
  errorElement.style.visibility = isValid ? "hidden" : "visible";
  inputElement.classList.toggle("input-error", !isValid);
};

const validateSignupForm = () => {
  const isNameValid = nameRegex.test(signupName.value);
  const isEmailValid = emailRegex.test(signupEmail.value.toLowerCase());
  const doPasswordsMatch = signupPassword.value && signupPassword.value === confirmPassword.value;
  // Use helper for each field
  updateFieldError(isNameValid, signupName, nameError);
  updateFieldError(isEmailValid, signupEmail, emailError);
  updateFieldError(doPasswordsMatch, signupPassword, passwordMatchError);
  updateFieldError(doPasswordsMatch, confirmPassword, passwordMatchError);
  // Policy check
  policyError.style.visibility = policyChecked ? "hidden" : "visible";

  return isNameValid && isEmailValid && doPasswordsMatch && policyChecked;
};

// Toggle checkbox image and state
acceptPolicyImg.addEventListener("click", () => {
  policyChecked = !policyChecked;
  acceptPolicyImg.src = policyChecked ? "./assets/svg/checked.svg" : "./assets/svg/check_button.svg";
  policyError.style.visibility = policyChecked ? "hidden" : "visible"; // Hide error immediately if checked
});

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

async function signupProcess(name, email, password) {
  const success = await addUser(name, email, password);

  if (!success) {
    return; // stop here
  }

  // Success flow
  showSignupSuccess();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  signupForm.reset();
  policyChecked = false;
  acceptPolicyImg.src = "./assets/svg/check_button.svg";
  showLoginScreen();
}

// async function signupProcess(name, email, password) {
//   await addUser(name, email, password);
//   showSignupSuccess();
//   await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1 second inline
//   signupForm.reset(); //  clear the form
//   policyChecked = false; // reset checkbox state
//   acceptPolicyImg.src = "./assets/svg/check_button.svg"; // reset checkbox icon
//   showLoginScreen();
// }

function showSignupSuccess() {
  const overlay = document.getElementById("signupOverlay");
  overlay.classList.remove("d_none");
  void overlay.offsetWidth; // force reflow so the animation can trigger
  overlay.classList.add("show");
}
