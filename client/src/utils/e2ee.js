/**
 * End-to-End Encryption (E2EE) Module for چکاوک (Chakavak)
 *
 * Implements Elliptic-Curve Diffie-Hellman (ECDH P-256) for zero-knowledge key exchange
 * and AES-GCM (256-bit) with fresh 96-bit random IVs for message encryption.
 * Security verification numbers (safety fingerprints) allow peer identity verification.
 */

const subtle = (typeof window !== "undefined" ? window.crypto?.subtle : globalThis.crypto?.subtle);

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates an ECDH key pair on the P-256 (secp256r1) curve.
 */
export async function generateEcdhKeyPair() {
  if (!subtle) throw new Error("Web Crypto API is not available.");
  return subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // extractable
    ["deriveKey", "deriveBits"],
  );
}

/**
 * Exports an ECDH public key to base64 SPKI format.
 */
export async function exportPublicKey(key) {
  if (!subtle) throw new Error("Web Crypto API is not available.");
  const spki = await subtle.exportKey("spki", key);
  return bufferToBase64(spki);
}

/**
 * Imports an ECDH public key from base64 SPKI format.
 */
export async function importPublicKey(base64Spki) {
  if (!subtle) throw new Error("Web Crypto API is not available.");
  const buffer = base64ToBuffer(base64Spki);
  return subtle.importKey(
    "spki",
    buffer,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    [],
  );
}

/**
 * Derives a 256-bit AES-GCM encryption key from private key and remote peer public key.
 */
export async function deriveSharedAesKey(myPrivateKey, peerPublicKey) {
  if (!subtle) throw new Error("Web Crypto API is not available.");
  return subtle.deriveKey(
    {
      name: "ECDH",
      public: peerPublicKey,
    },
    myPrivateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false, // non-extractable session key for security
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypts plaintext message using AES-GCM with fresh 12-byte IV.
 * Output format: e2ee:v1:<base64-iv>:<base64-ciphertext>
 */
export async function encryptE2eeText(plaintext, aesKey) {
  if (!subtle) throw new Error("Web Crypto API is not available.");
  const encoder = new TextEncoder();
  const data = encoder.encode(String(plaintext || ""));

  // 12-byte IV for AES-GCM
  const iv = (typeof window !== "undefined" ? window.crypto : globalThis.crypto).getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    aesKey,
    data,
  );

  const ivB64 = bufferToBase64(iv.buffer);
  const ctB64 = bufferToBase64(encryptedBuffer);

  return `e2ee:v1:${ivB64}:${ctB64}`;
}

/**
 * Decrypts an e2ee:v1 string using AES-GCM key.
 */
export async function decryptE2eeText(encryptedString, aesKey) {
  if (!subtle) throw new Error("Web Crypto API is not available.");
  const str = String(encryptedString || "").trim();
  if (!str.startsWith("e2ee:v1:")) {
    return str; // Not encrypted or fallback
  }

  const parts = str.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid E2EE payload format.");
  }

  const ivBuffer = base64ToBuffer(parts[2]);
  const ctBuffer = base64ToBuffer(parts[3]);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer),
    },
    aesKey,
    ctBuffer,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Checks if a string is an E2EE encrypted ciphertext.
 */
export function isE2eeCiphertext(text) {
  return typeof text === "string" && text.trim().startsWith("e2ee:v1:");
}

/**
 * Computes a deterministic 16-digit safety verification number (4 groups of 4 digits)
 * sorted alphabetically between both public keys, identical on both participants' screens.
 */
export async function generateSecurityNumber(pubKeyA, pubKeyB) {
  if (!subtle) return "0000-0000-0000-0000";
  const sorted = [String(pubKeyA), String(pubKeyB)].sort().join("::");
  const encoder = new TextEncoder();
  const hashBuffer = await subtle.digest("SHA-256", encoder.encode(sorted));
  const hashBytes = new Uint8Array(hashBuffer);

  // Generate 16 digits
  let numStr = "";
  for (let i = 0; i < 8; i++) {
    const val = (hashBytes[i * 2] << 8) | hashBytes[i * 2 + 1];
    numStr += String(val % 10000).padStart(4, "0");
  }

  const g1 = numStr.slice(0, 4);
  const g2 = numStr.slice(4, 8);
  const g3 = numStr.slice(8, 12);
  const g4 = numStr.slice(12, 16);

  return `${g1}-${g2}-${g3}-${g4}`;
}
