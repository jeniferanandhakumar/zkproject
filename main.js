document
  .getElementById("registerForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    fetch("http://127.0.0.1:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Server error: " + res.status);
        return res.json();
      })
      .then((data) => {
        alert("Registered successfully!");
        console.log(data);
      })
      .catch((err) => {
        alert("Network error. Try again later.");
        console.error("Fetch error:", err);
      });
  });

async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch("http://127.0.0.1:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();

  if (data.access_token) {
    localStorage.setItem("token", data.access_token); // save token
    alert("Login success ✅");
  } else {
    alert("Login failed ❌");
  }
}

// ---------------- Vault ----------------

// Fetch Vault
async function loadVault() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return alert("⚠️ Please login first");

    const res = await fetch("http://127.0.0.1:5000/api/vault", {
      method: "GET",
      headers: { Authorization: "Bearer " + token },
    });

    const data = await res.json();
    console.log("Vault:", data);

    const container = document.getElementById("vaultEntries");
    container.innerHTML = "";

    if (!res.ok) throw new Error(data.error || "Failed to fetch vault");

    if (!data.entries || data.entries.length === 0) {
      container.innerHTML = "<p>Vault is empty</p>";
      return;
    }

    data.entries.forEach((entry, i) => {
      const div = document.createElement("div");
      div.className = "entry";
      div.innerHTML = `
        <strong>${entry.site}</strong><br>
        Username: ${entry.user} 
        <button onclick="copyText('${entry.user}')">Copy</button><br>
        Password: •••••• 
        <button onclick="togglePass(this, '${entry.password}')">Show/Hide</button>
        <button onclick="deleteEntry('${entry.site}')">Delete</button>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Vault Load Error:", err);
    alert("❌ Error loading vault: " + err.message);
  }
}

// Save Vault
async function saveVault() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return alert("⚠️ Please login first");

    const site = document.getElementById("vaultSite").value.trim();
    const username = document.getElementById("vaultUser").value.trim();
    const password = document.getElementById("vaultPass").value.trim();

    if (!site || !username || !password) {
      alert("⚠️ Fill all vault fields");
      return;
    }

    const res = await fetch("http://127.0.0.1:5000/api/vault", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ site, user: username, password }),
    });

    const data = await res.json();
    console.log("Saved Vault:", data);

    if (res.ok) {
      alert("✅ Vault saved successfully");
      loadVault();
    } else {
      alert("❌ Vault save failed: " + (data.error || JSON.stringify(data)));
    }
  } catch (err) {
    console.error("Vault Save Error:", err);
    alert("❌ Network Error while saving vault");
  }
}

// Delete Vault Entry
async function deleteEntry(site) {
  const confirmDelete = confirm("Delete " + site + "?");
  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://127.0.0.1:5000/api/vault/${site}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (res.ok) {
      alert("✅ Entry deleted");
      loadVault();
    } else alert("❌ Delete failed: " + data.error);
  } catch (err) {
    console.error("Delete Vault Error:", err);
    alert("❌ Network error while deleting entry");
  }
}

// Utility Functions
function copyText(text) {
  navigator.clipboard.writeText(text);
  alert("Copied!");
}

function togglePass(btn, pass) {
  if (btn.textContent === "Show/Hide") {
    btn.textContent = "Hide";
    btn.previousSibling.textContent = pass;
  } else {
    btn.textContent = "Show/Hide";
    btn.previousSibling.textContent = "••••••";
  }
}
