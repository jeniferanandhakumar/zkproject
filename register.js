// register.js — Handles registration form submission
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value.trim();
    const password = form.password.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();

    if (!email || !password || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Registration failed");
        return;
      }

      localStorage.setItem("token", data.token);
      alert("Registration successful!");
      window.location.href = "vault.html";
    } catch (err) {
      console.error("Registration error:", err);
      alert("Network error. Try again later.");
    }
  });
});
fetch("http://127.0.0.1:5000/api/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
  }),
})
  .then((res) => res.json())
  .then((data) => {
    alert("Registered Successfully!");
  })
  .catch((err) => {
    console.error("Fetch Error:", err);
    alert("Network error. Try again later.");
  });
