// regex patterns
const nameRegex = /^[a-zA-ZÀ-ÖØ-öø-ÿß\s'-]+$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// references
const signupForm = document.getElementById("signUpForm");

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

// Toggle checkbox image and state
acceptPolicyImg.addEventListener("click", () => {
  policyChecked = !policyChecked;
  acceptPolicyImg.src = policyChecked ? "./assets/svg/checked.svg" : "./assets/svg/check_button.svg";

  // Hide error immediately if checked
  policyError.style.visibility = policyChecked ? "hidden" : "visible";
});

//validate function
const validateSignupForm = () => {
  const isNameValid = nameRegex.test(signupName.value);
  const isEmailValid = emailRegex.test(signupEmail.value);
  const doPasswordsMatch = signupPassword.value && signupPassword.value === confirmPassword.value;

  nameError.style.visibility = isNameValid ? "hidden" : "visible";
  signupName.classList.toggle("input-error", !isNameValid);
  emailError.style.visibility = isEmailValid ? "hidden" : "visible";
  signupEmail.classList.toggle("input-error", !isEmailValid);
  passwordMatchError.style.visibility = doPasswordsMatch ? "hidden" : "visible";
  signupPassword.classList.toggle("input-error", !doPasswordsMatch);
  confirmPassword.classList.toggle("input-error", !doPasswordsMatch);

  // Only validate if policy is checked
  if (!policyChecked) {
    policyError.style.visibility = "visible";
  }

  return nameError.style.visibility === "hidden" && emailError.style.visibility === "hidden" && passwordMatchError.style.visibility === "hidden" && policyChecked;
};

// Single submit listener
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateSignupForm()) return;
  const name = signupName.value;
  const email = signupEmail.value;
  const password = signupPassword.value;
  try {
    await addUser(name, email, password);
    alert("You signed up successfully!");
    signupForm.reset(); //  clear the form
    policyChecked = false; // reset your custom checkbox state
    acceptPolicyImg.src = "./assets/svg/check_button.svg"; // reset checkbox icon
    showLoginScreen();
  } catch (err) {
    console.error("Signup failed:", err);
  }
});
