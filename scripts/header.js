function logout() {
  localStorage.removeItem("currentUser"); // clear only the login info
  // or localStorage.clear(); if you want to wipe everything
}
