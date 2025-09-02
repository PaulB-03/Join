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

document.getElementById("signUpForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  addUser(name, email, password);
});
