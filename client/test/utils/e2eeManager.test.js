import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getOrCreateChatKeyPair,
  handlePeerPublicKey,
  encryptSecretMessage,
  decryptSecretMessage,
  getChatSecurityNumber,
  isE2eeCiphertext,
} from "../../src/utils/e2eeManager.js";
import { generateEcdhKeyPair, exportPublicKey } from "../../src/utils/e2ee.js";

describe("E2EE Session Manager", () => {
  let mockStore = {};

  beforeEach(() => {
    mockStore = {};
    const fakeLocalStorage = {
      getItem: (key) => mockStore[key] ?? null,
      setItem: (key, val) => {
        mockStore[key] = String(val);
      },
      removeItem: (key) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
    };
    vi.stubGlobal("localStorage", fakeLocalStorage);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("generates and persists user key pair for chat", async () => {
    const keys1 = await getOrCreateChatKeyPair("chat-test-1");
    expect(keys1).toBeDefined();
    expect(typeof keys1.publicKeyBase64).toBe("string");
    expect(keys1.publicKeyBase64.length).toBeGreaterThan(20);

    // Second call should retrieve from storage/cache
    const keys2 = await getOrCreateChatKeyPair("chat-test-1");
    expect(keys2.publicKeyBase64).toBe(keys1.publicKeyBase64);
  });

  test("derives shared key and encrypts/decrypts end-to-end between two peers", async () => {
    const chatId = "secret-room-abc";

    // Alice generates key
    const aliceKeys = await getOrCreateChatKeyPair(chatId);

    // Bob generates key
    const bobKeyPair = await generateEcdhKeyPair();
    const bobPubBase64 = await exportPublicKey(bobKeyPair.publicKey);

    // Alice handles Bob's public key
    const aliceAes = await handlePeerPublicKey(chatId, bobPubBase64);
    expect(aliceAes).toBeDefined();

    // Alice encrypts
    const secretMsg = "سلام، این یک پیام کاملاً محرمانه است! 🔒🕊️";
    const ciphertext = await encryptSecretMessage(chatId, secretMsg);

    expect(isE2eeCiphertext(ciphertext)).toBe(true);
    expect(ciphertext.startsWith("e2ee:v1:")).toBe(true);
    expect(ciphertext).not.toContain(secretMsg);

    // Alice can decrypt her own message or Bob can decrypt
    const decrypted = await decryptSecretMessage(chatId, ciphertext);
    expect(decrypted).toBe(secretMsg);

    // Safety verification numbers
    const safetyNumber = await getChatSecurityNumber(chatId);
    expect(safetyNumber).toMatch(/^\d{4}-\d{4}-\d{4}-\d{4}$/);
  });
});
