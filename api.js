// api.js - minimal API helper (no auth storage; uses localStorage for token)
const API_BASE =
  (location.origin.includes("http://") ? location.origin : location.origin) +
  "/api";

export async function apiRegister(email, verifierHex, saltHex) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, verifier: verifierHex, salt: saltHex }),
  });
  return res.json();
}

export async function apiGetSalt(email) {
  const res = await fetch(
    `${API_BASE}/salt?email=${encodeURIComponent(email)}`
  );
  return res.json();
}

export async function apiLogin(email, verifierHex) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, verifier: verifierHex }),
  });
  return res.json();
}

export function storeToken(token) {
  localStorage.setItem("zkpm_token", token);
}
export function getToken() {
  return localStorage.getItem("zkpm_token");
}
export function clearToken() {
  localStorage.removeItem("zkpm_token");
}

export async function fetchVault() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/vault`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("unauthenticated");
  if (!res.ok) return null;
  return res.json();
}

export async function uploadVault(cipherHex, ivHex) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/vault`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cipherHex, ivHex }),
  });
  return res.json();
}
