// crypto.js - WebCrypto helpers (Improved Version)
const enc = new TextEncoder();
const dec = new TextDecoder();

// --- Utility ---
export function toHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
export function toBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
export function fromBase64(b64) {
  return new Uint8Array(
    atob(b64)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
}
export async function randomBytes(len = 16) {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return b;
}

// --- Key derivation ---
export async function deriveKeyFromPassword(
  password,
  saltHex = null,
  iterations = 600000 // Increased for more brute-force resistance
) {
  if (!saltHex) {
    const s = await randomBytes(16);
    saltHex = toHex(s);
  }
  const salt = fromHex(saltHex);
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const derivedKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-512" }, // SHA-512 for better key stretching
    baseKey,
    { name: "AES-GCM", length: 256 },
    false, // Non-extractable for better security
    ["encrypt", "decrypt"]
  );
  const raw = await crypto.subtle.exportKey("raw", derivedKey);
  const rawHex = toHex(raw);
  return { key: derivedKey, rawHex, saltHex };
}

export async function importAesKeyFromRawHex(rawHex) {
  const raw = fromHex(rawHex);
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

// --- Encryption / Decryption with versioning ---
export async function encryptStringWithKey(key, plaintext) {
  const iv = await randomBytes(12);
  const version = "v1"; // Add encryption version for forward compatibility
  const data = enc.encode(plaintext);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { version, cipherHex: toHex(ct), ivHex: toHex(iv) };
}

export async function decryptStringWithKey(key, cipherHex, ivHex) {
  const ct = fromHex(cipherHex);
  const iv = fromHex(ivHex);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ct
  );
  return dec.decode(decrypted);
}

// --- Hashing ---
export async function sha256(str) {
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(str));
  return toHex(hash);
}
export async function sha512(str) {
  const hash = await crypto.subtle.digest("SHA-512", enc.encode(str));
  return toHex(hash);
}

// --- HMAC ---
export async function generateHMAC(keyHex, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    fromHex(keyHex),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toHex(sig);
}
export async function verifyHMAC(keyHex, message, signatureHex) {
  const key = await crypto.subtle.importKey(
    "raw",
    fromHex(keyHex),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    fromHex(signatureHex),
    enc.encode(message)
  );
}

// --- Key wrapping / unwrapping ---
export async function wrapKey(keyToWrap, wrappingKey) {
  const iv = await randomBytes(12);
  const wrapped = await crypto.subtle.wrapKey("raw", keyToWrap, wrappingKey, {
    name: "AES-GCM",
    iv,
  });
  return { wrappedHex: toHex(wrapped), ivHex: toHex(iv) };
}
export async function unwrapKey(wrappedHex, wrappingKey, ivHex) {
  return crypto.subtle.unwrapKey(
    "raw",
    fromHex(wrappedHex),
    wrappingKey,
    { name: "AES-GCM", iv: fromHex(ivHex) },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// --- Password strength check (improved) ---
export function checkPasswordStrength(password) {
  let score = 0;
  const length = password.length;

  if (length >= 12) score += 2; // Stronger min length
  else if (length >= 8) score++;

  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Penalize common passwords
  const commonPasswords = ["password", "123456", "qwerty", "letmein"];
  if (commonPasswords.includes(password.toLowerCase())) score = 0;

  return ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"][
    Math.min(score, 4)
  ];
}
