// login.js — Handles login form submission
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // ✅ submit reload prevent pannuthu

    const email = form.email.value.trim();
    const password = form.password.value.trim();

    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        // change port 5000
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.access_token); // backend returns access_token
      alert("Login successful!");
      window.location.href = "vault.html"; // Redirect to vault page
    } catch (err) {
      console.error("Login error:", err);
      alert("Network error. Try again later.");
    }
  });
});
