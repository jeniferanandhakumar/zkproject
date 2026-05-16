// vault.js - manage vault UI + encryption
import {
  deriveKeyFromPassword,
  importAesKeyFromRawHex,
  encryptStringWithKey,
  decryptStringWithKey,
} from "./crypto.js";
import { fetchVault, uploadVault, getToken, clearToken } from "./api.js";
import { showMessage } from "./ui.js";

let unlocked = false;
let aesKey = null;
let vaultEntries = [];

const loadBtn = document.getElementById("loadVault");
const saveBtn = document.getElementById("saveVault");
const addBtn = document.getElementById("addEntry");
const clearBtn = document.getElementById("clearVault");
const logoutBtn = document.getElementById("logoutBtn");

const vaultListEl = document.getElementById("vault-list");

function renderVaultList() {
  vaultListEl.innerHTML = "";
  vaultEntries.forEach((e, idx) => {
    const item = document.createElement("div");
    item.className = "vault-item";
    item.innerHTML = `
      <div class="meta">
        <div>
          <div class="site">${e.site}</div>
          <div class="username">${e.username}</div>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-sm" data-idx="${idx}" data-action="reveal">Reveal</button>
        <button class="btn btn-sm ghost" data-idx="${idx}" data-action="copy">Copy</button>
        <button class="btn btn-sm danger" data-idx="${idx}" data-action="del">Delete</button>
      </div>
    `;
    vaultListEl.appendChild(item);
  });
}

vaultListEl?.addEventListener("click", (ev) => {
  const btn = ev.target.closest("button");
  if (!btn) return;
  const idx = Number(btn.dataset.idx);
  const action = btn.dataset.action;
  const entry = vaultEntries[idx];
  if (!entry) return;
  if (action === "reveal") {
    alert(`Password for ${entry.site}: ${entry.password}`);
  } else if (action === "copy") {
    navigator.clipboard
      .writeText(entry.password)
      .then(() => showMessage("Copied to clipboard", "info"));
    // auto-clear clipboard after 12s
    setTimeout(async () => {
      try {
        await navigator.clipboard.writeText("");
      } catch (_) {}
    }, 12000);
  } else if (action === "del") {
    if (!confirm("Delete entry?")) return;
    vaultEntries.splice(idx, 1);
    renderVaultList();
  }
});

loadBtn?.addEventListener("click", async () => {
  const email = document.getElementById("vaultEmail").value.trim();
  const password = document.getElementById("vaultPassword").value;
  if (!email || !password) {
    showMessage("email + master password required", "error");
    return;
  }
  try {
    // get salt
    const saltResp = await fetch(
      `${location.origin}/api/salt?email=${encodeURIComponent(email)}`
    );
    const saltJs = await saltResp.json();
    if (!saltJs?.salt) {
      showMessage("user not found", "error");
      return;
    }
    const derived = await deriveKeyFromPassword(password, saltJs.salt);
    // use derived.rawHex as raw AES key
    aesKey = await importAesKeyFromRawHex(derived.rawHex);
    // fetch encrypted vault
    const vaultRes = await fetch(`${location.origin}/api/vault`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!vaultRes.ok) {
      showMessage("failed to fetch vault (auth?)", "error");
      return;
    }
    const vaultJson = await vaultRes.json();
    if (!vaultJson?.cipherHex) {
      // empty vault
      vaultEntries = [];
    } else {
      const plain = await decryptStringWithKey(
        aesKey,
        vaultJson.cipherHex,
        vaultJson.ivHex
      );
      try {
        vaultEntries = JSON.parse(plain);
      } catch (e) {
        showMessage("Failed to parse vault JSON", "error");
        vaultEntries = [];
      }
    }
    unlocked = true;
    document.getElementById("vaultControls").style.display = "block";
    renderVaultList();
    showMessage("Vault unlocked", "info");
  } catch (err) {
    console.error(err);
    showMessage("Load error: " + err.message, "error");
  }
});

addBtn?.addEventListener("click", async () => {
  if (!unlocked) {
    showMessage("Unlock first", "error");
    return;
  }
  const site = document.getElementById("siteInput").value.trim();
  const username = document.getElementById("userInput").value.trim();
  const password = document.getElementById("passInput").value.trim();
  if (!site || !username || !password) {
    showMessage("Fill all fields", "error");
    return;
  }
  vaultEntries.push({ site, username, password });
  renderVaultList();
  // clear inputs
  document.getElementById("siteInput").value = "";
  document.getElementById("userInput").value = "";
  document.getElementById("passInput").value = "";
});

saveBtn?.addEventListener("click", async () => {
  if (!unlocked || !aesKey) {
    showMessage("Unlock first", "error");
    return;
  }
  try {
    const plain = JSON.stringify(vaultEntries);
    const enc = await encryptStringWithKey(aesKey, plain);
    const res = await fetch(`${location.origin}/api/vault`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ cipherHex: enc.cipherHex, ivHex: enc.ivHex }),
    });
    if (!res.ok) {
      showMessage("Save failed", "error");
      return;
    }
    showMessage("Vault saved", "info");
  } catch (err) {
    console.error(err);
    showMessage("Save error: " + err.message, "error");
  }
});

clearBtn?.addEventListener("click", () => {
  unlocked = false;
  aesKey = null;
  vaultEntries = [];
  document.getElementById("vaultControls").style.display = "none";
  showMessage("Local unlock cleared", "info");
});

logoutBtn?.addEventListener("click", () => {
  clearToken();
  location.href = "auth.html";
});
