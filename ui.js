// ui.js - small UI helpers

export function showMessage(text, type = "info", timeout = 3000) {
  const holder = document.getElementById("messageHolder") || document.body;
  const el = document.createElement("div");
  el.className = `alert ${
    type === "error" ? "error" : type === "warn" ? "warn" : "info"
  }`;
  el.textContent = text;
  holder.appendChild(el);
  setTimeout(() => el.remove(), timeout);
}
