const BASE_URL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app";

// 1. Check for existing user by email
function checkForUser(users, email) {
  if (users && Object.values(users).some((u) => u.email === email)) {
    signupEmail.classList.add("input-error");
    emailError.style.visibility = "visible";
    emailError.innerHTML = "This email address is already used.";
    return true; // user exists
  }
  // Reset error state if not duplicate
  signupEmail.classList.remove("input-error");
  emailError.style.visibility = "hidden";
  emailError.innerHTML = "Please use a valid email address.";
  return false;
}

// 2. Determine the next index
function checkIndexPosition(users) {
  const keys = users ? Object.keys(users) : [];
  const numbers = keys.map((k) => parseInt(k.replace("user", "")));
  return numbers.length ? Math.max(...numbers) + 1 : 1;
}

// 3. Save new user to database
async function saveNewUser(newUser, nextIndex) {
  const newKey = `user${nextIndex}`;
  const response = await fetch(`${BASE_URL}/users/${newKey}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newUser),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("error saving:", response.status, errorText);
    return null;
  }
  console.log(`User added as ${newKey}`);
  return newKey;
}

// 4. Main function
async function addUser(name, email, password) {
  let phone = "add phone number";
  const newUser = { name, email, password };
  const res = await fetch(`${BASE_URL}/users.json`); // Load existing users
  const users = await res.json();
  if (checkForUser(users, email)) {
    // Check for existing user
    return false;
  }
  const nextIndex = checkIndexPosition(users); // Determine next index
  const newKey = await saveNewUser(newUser, nextIndex); // Save new user
  if (!newKey) return false;
  await addContact({ name, email, phone }); // Add contact if user saved successfully
  return true;
}

function showSignupScreen() {
  document.getElementById("loginScreen").classList.add("d_none");
  document.getElementById("showSignUp").classList.add("hidden");
  document.getElementById("showSignUpMobile").classList.add("hidden");
  document.getElementById("signupScreen").classList.remove("d_none");
}

function showLoginScreen() {
  signupForm.reset(); // clear the form
  policyChecked = false;
  document.getElementById("loginScreen").classList.remove("d_none");
  document.getElementById("showSignUp").classList.remove("hidden");
  document.getElementById("showSignUpMobile").classList.remove("hidden");
  document.getElementById("signupScreen").classList.add("d_none");
  document.getElementById("signupOverlay").classList.add("d_none");
  signupForm.querySelectorAll("*").forEach((el) => el.classList.remove("input-error"));
  nameError.style.visibility = "hidden";
  emailError.style.visibility = "hidden";
  passwordMatchError.style.visibility = "hidden";
  policyError.style.visibility = "hidden";
}

// icons für die form

// Attach behavior to all three password fields
document.querySelectorAll("#signupPassword, #confirmPassword, #signinPassword", "#signupName", "#signupEmail", "#signinEmail").forEach((input) => {
  setupPasswordInput(document.getElementById("signupPassword"));
  setupPasswordInput(document.getElementById("confirmPassword"));
  setupPasswordInput(document.getElementById("signinPassword"));
  removeInputErrorOnInput(document.getElementById("signupName"), nameError);
  removeInputErrorOnInput(document.getElementById("signupEmail"), emailError);
  removeInputErrorOnInput(document.getElementById("signinEmail"));
  removeInputErrorOnInput(document.getElementById("signupPassword"));
  removeInputErrorOnInput(document.getElementById("confirmPassword"), passwordMatchError);
  removeInputErrorOnInput(document.getElementById("signinPassword"), loginError);
});

function removeInputErrorOnInput(input, errorElement) {
  input.addEventListener("input", () => {
    if (errorElement) {
      // only if an error element is provided
      errorElement.style.visibility = "hidden";
      input.classList.remove("input-error");
    } else {
      input.classList.remove("input-error");
    }
  });
}

function updatePasswordIconOnInput(input, state) {
  input.addEventListener("input", () => {
    if (input.value.trim() === "") {
      input.classList.remove("formVisibilityOffIcon", "formVisibilityIcon");
      input.classList.add("formLockIcon");
      input.type = "password"; // reset to password
      state.visible = false;
    } else if (!state.visible) {
      input.classList.remove("formLockIcon", "formVisibilityIcon");
      input.classList.add("formVisibilityOffIcon");
    }
  });
}

function togglePasswordVisibilityOnClick(input, state) {
  input.addEventListener("click", (e) => {
    const iconAreaClicked = e.offsetX > input.clientWidth - 30;
    if (!iconAreaClicked || input.value.trim() === "") return;

    if (state.visible) {
      input.type = "password";
      input.classList.remove("formVisibilityIcon");
      input.classList.add("formVisibilityOffIcon");
    } else {
      makePasswordVisible(input);
    }
    state.visible = !state.visible;
  });
}

function makePasswordVisible(input) {
  input.type = "text";
  input.classList.remove("formVisibilityOffIcon");
  input.classList.add("formVisibilityIcon");
}

function setupPasswordInput(input) {
  const state = { visible: false }; // each input has its own state
  updatePasswordIconOnInput(input, state);
  togglePasswordVisibilityOnClick(input, state);
}
