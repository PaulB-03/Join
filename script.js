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
