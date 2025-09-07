document.getElementById("guestLogin").addEventListener("click", () => {
  window.location.href = "../html/summary.html";
});

document.getElementById("signinForm").addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the form from reloading the page

  const signinEmail = document.getElementById("signinEmail").value.trim();
  const signinPassword = document.getElementById("signinPassword").value.trim();

  try {
    // Fetch all users from Realtime Database
    const res = await fetch(`${BASE_URL}/users.json`);

    const data = await res.json();
    console.log(data);

    if (!data) {
      console.log("No users found!");
      return;
    }

    // Check if email + password match

    let foundUser = null;
    for (const key in data) {
      const user = data[key];
      if (user.email === signinEmail && user.password === signinPassword) {
        foundUser = user;
        break;
      }
    }

    if (foundUser) {
      window.location.href = "../html/summary.html";
      console.log(foundUser);
    } else {
      loginError.style.visibility = "visible";
      document.getElementById("signinEmail").classList.add("input-error");
      document.getElementById("signinPassword").classList.add("input-error");
    }
  } catch (error) {
    console.error("Error during sign in:", error);
    loginError.style.visibility = "visible";
    document.getElementById("signinEmail").classList.add("input-error");
    document.getElementById("signinPassword").classList.add("input-error");
  }
});
