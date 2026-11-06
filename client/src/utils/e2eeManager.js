/**
 * E2EE Session Manager for چکاوک (Chakavak)
 *
 * Manages ECDH key pairs, AES-GCM session keys, and message encryption/decryption
 * per secret chat using browser storage and memory cache.
 */

import {
  generateEcdhKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedAesKey,
  encryptE2eeText,
  decryptE2eeText,
  generateSecurityNumber,
  isE2eeCiphertext,
} from "./e2ee.js";

export { isE2eeCiphertext };

const AES_KEY_CACHE = new Map(); // chatId -> CryptoKey
const PEER_PUB_CACHE = new Map(); // chatId -> base64
const MY_PUB_CACHE = new Map(); // chatId -> base64
const DECRYPTED_TEXT_CACHE = new Map(); // ciphertext -> plaintext

function getStorageKey(chatId, suffix) {
  return `chakavak_e2ee_${chatId}_${suffix}`;
}

/**
 * Initializes or loads my ECDH key pair for a secret chat.
 */
export async function getOrCreateChatKeyPair(chatId) {
  if (!chatId) return null;

  const pubKeyStorage = getStorageKey(chatId, "pub");
  const privKeyStorage = getStorageKey(chatId, "priv");

  let storedPub = null;
  let storedPriv = null;
  try {
    storedPub = localStorage.getItem(pubKeyStorage);
    storedPriv = localStorage.getItem(privKeyStorage);
  } catch {}

  if (storedPub && storedPriv) {
    MY_PUB_CACHE.set(chatId, storedPub);
    return {
      publicKeyBase64: storedPub,
      privateKeyJwk: JSON.parse(storedPriv),
    };
  }

  // Generate new key pair
  const keyPair = await generateEcdhKeyPair();
  const subtle = (typeof window !== "undefined" ? window.crypto?.subtle : globalThis.crypto?.subtle);

  const exportedPub = await exportPublicKey(keyPair.publicKey);
  const exportedPriv = await subtle.exportKey("jwk", keyPair.privateKey);

  try {
    localStorage.setItem(pubKeyStorage, exportedPub);
    localStorage.setItem(privKeyStorage, JSON.stringify(exportedPriv));
  } catch {}

  MY_PUB_CACHE.set(chatId, exportedPub);

  return {
    publicKeyBase64: exportedPub,
    privateKeyJwk: exportedPriv,
  };
}

/**
 * Imports my private key from stored JWK.
 */
async function getMyPrivateKey(chatId) {
  const privKeyStorage = getStorageKey(chatId, "priv");
  let storedPriv = null;
  try {
    storedPriv = localStorage.getItem(privKeyStorage);
  } catch {}
  if (!storedPriv) return null;

  const subtle = (typeof window !== "undefined" ? window.crypto?.subtle : globalThis.crypto?.subtle);
  return subtle.importKey(
    "jwk",
    JSON.parse(storedPriv),
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"],
  );
}

/**
 * Processes remote peer's public key and derives shared AES-GCM key.
 */
export async function handlePeerPublicKey(chatId, peerPublicKeyBase64) {
  if (!chatId || !peerPublicKeyBase64) return null;

  PEER_PUB_CACHE.set(chatId, peerPublicKeyBase64);
  try {
    localStorage.setItem(getStorageKey(chatId, "peer_pub"), peerPublicKeyBase64);
  } catch {}

  const myPrivateKey = await getMyPrivateKey(chatId);
  if (!myPrivateKey) return null;

  const peerKey = await importPublicKey(peerPublicKeyBase64);
  const sharedAesKey = await deriveSharedAesKey(myPrivateKey, peerKey);

  AES_KEY_CACHE.set(chatId, sharedAesKey);
  return sharedAesKey;
}

/**
 * Gets active derived AES key for chat, restoring from stored peer pub if needed.
 */
export async function getChatAesKey(chatId) {
  if (AES_KEY_CACHE.has(chatId)) {
    return AES_KEY_CACHE.get(chatId);
  }

  let peerPub = PEER_PUB_CACHE.get(chatId);
  if (!peerPub) {
    try {
      peerPub = localStorage.getItem(getStorageKey(chatId, "peer_pub"));
    } catch {}
  }

  if (peerPub) {
    return handlePeerPublicKey(chatId, peerPub);
  }

  return null;
}

/**
 * Encrypts a message for a secret chat.
 */
export async function encryptSecretMessage(chatId, plaintext) {
  const aesKey = await getChatAesKey(chatId);
  if (!aesKey) {
    // If key not ready yet, return as plaintext or handshake
    return plaintext;
  }
  return encryptE2eeText(plaintext, aesKey);
}

/**
 * Decrypts a secret chat message (with in-memory cache).
 */
export async function decryptSecretMessage(chatId, ciphertext) {
  if (!isE2eeCiphertext(ciphertext)) {
    return ciphertext;
  }

  if (DECRYPTED_TEXT_CACHE.has(ciphertext)) {
    return DECRYPTED_TEXT_CACHE.get(ciphertext);
  }

  const aesKey = await getChatAesKey(chatId);
  if (!aesKey) {
    return "🔒 [پیام رمزنگاری‌شده سرتاسری]";
  }

  try {
    const decrypted = await decryptE2eeText(ciphertext, aesKey);
    DECRYPTED_TEXT_CACHE.set(ciphertext, decrypted);
    return decrypted;
  } catch {
    return "🔒 [خطا در رمزگشایی با کلید جاری]";
  }
}

/**
 * Generates security safety verification numbers for the chat.
 */
export async function getChatSecurityNumber(chatId) {
  let myPub = MY_PUB_CACHE.get(chatId);
  if (!myPub) {
    try {
      myPub = localStorage.getItem(getStorageKey(chatId, "pub"));
    } catch {}
  }

  let peerPub = PEER_PUB_CACHE.get(chatId);
  if (!peerPub) {
    try {
      peerPub = localStorage.getItem(getStorageKey(chatId, "peer_pub"));
    } catch {}
  }

  if (!myPub || !peerPub) {
    return "در انتظار تبادل کلید...";
  }

  return generateSecurityNumber(myPub, peerPub);
}
