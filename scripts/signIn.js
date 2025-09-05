  const BASE_URL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app";
  
  
  document.getElementById("signinForm").addEventListener("submit", async (event) => {
    event.preventDefault(); // stop the form from reloading the page

    const email = document.getElementById("signinEmail").value.trim();
    const password = document.getElementById("signinPassword").value.trim();

    try {
      // Fetch all users from Realtime Database
      const res = await fetch(`${BASE_URL}/users.json`);
      const data = await res.json();

      if (!data) {
        alert("No users found!");
        return;
      }

      // Check if email + password match
      let foundUser = null;
      for (const key in data) {
        const user = data[key];
        if (user.email === email && user.password === password) {
          foundUser = user;
          break;
        }
      }

      if (foundUser) {
        // ✅ Login successful → redirect
        window.location.href = "summary.html";
      } else {
        alert("Invalid email or password!");
      }

    } catch (err) {
      console.error("Error during login:", err);
      alert("Login failed. Please try again.");
    }
  });