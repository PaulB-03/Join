function logout() {
  localStorage.removeItem("showedOnce");
  localStorage.removeItem("currentUser"); // clear only the login info
}
