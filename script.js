async function includeHTML() {
  let includeElements = document.querySelectorAll("[w3-include-html]");
  for (let i = 0; i < includeElements.length; i++) {
    const element = includeElements[i];
    const file = element.getAttribute("w3-include-html");

    try {
      let resp = await fetch(file);
      if (resp.ok) {
        element.innerHTML = await resp.text();
      } else {
        element.innerHTML = "Page not found";
      }
    } catch (e) {
      element.innerHTML = "Error loading include";
    }

    // Klasse entfernen → CSS bestimmt, wie es angezeigt wird
    element.classList.remove("d_none");
  }
}

function showSignupScreen() {
  document.getElementById("loginScreen").classList.add("d_none");
  document.getElementById("indexHeaderRight").classList.add("d_none");
  document.getElementById("signupScreen").classList.remove("d_none");
}

function showLoginScreen() {
  document.getElementById("loginScreen").classList.remove("d_none");
  document.getElementById("indexHeaderRight").classList.remove("d_none");
  document.getElementById("signupScreen").classList.add("d_none");
}
