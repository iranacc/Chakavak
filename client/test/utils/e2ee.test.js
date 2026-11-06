import { describe, test, expect } from "vitest";
import {
  generateEcdhKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedAesKey,
  encryptE2eeText,
  decryptE2eeText,
  generateSecurityNumber,
} from "../../src/utils/e2ee.js";

describe("E2EE Web Crypto module", () => {
  test("generates ECDH keypair and exports/imports public key", async () => {
    const keyPair = await generateEcdhKeyPair();
    expect(keyPair).toHaveProperty("publicKey");
    expect(keyPair).toHaveProperty("privateKey");

    const exported = await exportPublicKey(keyPair.publicKey);
    expect(typeof exported).toBe("string");
    expect(exported.length).toBeGreaterThan(20);

    const imported = await importPublicKey(exported);
    expect(imported).toBeDefined();
    expect(imported.type).toBe("public");
  });

  test("derives identical shared AES keys on both ends (Alice & Bob)", async () => {
    // Alice
    const alicePair = await generateEcdhKeyPair();
    const alicePubStr = await exportPublicKey(alicePair.publicKey);

    // Bob
    const bobPair = await generateEcdhKeyPair();
    const bobPubStr = await exportPublicKey(bobPair.publicKey);

    // Alice imports Bob's public key and derives key
    const bobPubImported = await importPublicKey(bobPubStr);
    const aliceSharedKey = await deriveSharedAesKey(alicePair.privateKey, bobPubImported);

    // Bob imports Alice's public key and derives key
    const alicePubImported = await importPublicKey(alicePubStr);
    const bobSharedKey = await deriveSharedAesKey(bobPair.privateKey, alicePubImported);

    expect(aliceSharedKey).toBeDefined();
    expect(bobSharedKey).toBeDefined();

    // Alice encrypts
    const secretMessage = "درود بر رفیق گرامی! این یک پیام فوق‌محرمانه است 🕊️🔒";
    const ciphertext = await encryptE2eeText(secretMessage, aliceSharedKey);
    expect(ciphertext.startsWith("e2ee:v1:")).toBe(true);

    // Bob decrypts
    const decrypted = await decryptE2eeText(ciphertext, bobSharedKey);
    expect(decrypted).toBe(secretMessage);
  });

  test("generates identical 4-group security number for key verification", async () => {
    const pairA = await generateEcdhKeyPair();
    const pubA = await exportPublicKey(pairA.publicKey);

    const pairB = await generateEcdhKeyPair();
    const pubB = await exportPublicKey(pairB.publicKey);

    const fingerprint1 = await generateSecurityNumber(pubA, pubB);
    const fingerprint2 = await generateSecurityNumber(pubB, pubA);

    expect(fingerprint1).toBe(fingerprint2);
    expect(fingerprint1).toMatch(/^\d{4}-\d{4}-\d{4}-\d{4}$/);
  });
});
