const BASE_URL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app";

async function addUser(name, email, password) {
  const newUser = { name, email, password };

  // Bestehende User laden
  const res = await fetch(`${BASE_URL}/users.json`);
  const users = await res.json();
  console.log(users);

  // Neuen Index bestimmen
  let nextIndex = 1;
  if (users) {
    const keys = Object.keys(users);
    const numbers = keys.map((k) => parseInt(k.replace("user", "")));
    nextIndex = Math.max(...numbers) + 1;
  }
  const newKey = `user${nextIndex}`;

  const response = await fetch(`${BASE_URL}/users/${newKey}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newUser),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Fehler beim Speichern:", response.status, errorText);
    return;
  }

  console.log(`User added as ${newKey}`);
}

function showSignupScreen() {
  document.getElementById("loginScreen").classList.add("d_none");
  document.getElementById("indexHeaderRight").classList.add("hidden");
  document.getElementById("signupScreen").classList.remove("d_none");
}

function showLoginScreen() {
  document.getElementById("loginScreen").classList.remove("d_none");
  document.getElementById("indexHeaderRight").classList.remove("hidden");
  document.getElementById("signupScreen").classList.add("d_none");
}

// icons für die form

// Attach behavior to all three password fields
document.querySelectorAll("#signupPassword, #confirmPassword, #signinPassword").forEach((input) => {
  setupPasswordInput(document.getElementById("signupPassword"));
  setupPasswordInput(document.getElementById("confirmPassword"));
  setupPasswordInput(document.getElementById("signinPassword"));
});

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
      input.type = "text";
      input.classList.remove("formVisibilityOffIcon");
      input.classList.add("formVisibilityIcon");
    }
    state.visible = !state.visible;
  });
}

function setupPasswordInput(input) {
  const state = { visible: false }; // each input has its own state
  updatePasswordIconOnInput(input, state);
  togglePasswordVisibilityOnClick(input, state);
}
