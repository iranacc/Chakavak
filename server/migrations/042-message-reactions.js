/**
 * Migration 042: Message reactions support.
 *
 * Adds a `message_reactions` table to store emoji reactions on chat messages.
 * Each user can react with specific emojis to any message in a chat they have access to.
 * An index on (message_id) allows fast aggregation of reactions per message.
 */
export const migration042MessageReactions = {
  version: 42,
  up: ({ db, tableExists }) => {
    if (!tableExists("message_reactions")) {
      db.run(`
        CREATE TABLE IF NOT EXISTS message_reactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          emoji TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(message_id, user_id, emoji)
        )
      `);
    }
    db.run(
      "CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id)",
    );
    db.run(
      "CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id)",
    );
  },
};
