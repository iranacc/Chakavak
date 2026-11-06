/**
 * Migration 045: E2EE Secret Chat Public Keys.
 *
 * Stores participant ECDH public keys for End-to-End Encrypted (E2EE) secret chats.
 */
export const migration045E2eeKeys = {
  version: 45,
  up: ({ db, tableExists }) => {
    if (!tableExists("chat_e2ee_keys")) {
      db.run(`
        CREATE TABLE IF NOT EXISTS chat_e2ee_keys (
          chat_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          public_key TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (chat_id, user_id)
        )
      `);
    }

    db.run(
      "CREATE INDEX IF NOT EXISTS idx_chat_e2ee_keys_chat_id ON chat_e2ee_keys(chat_id)",
    );
  },
};
