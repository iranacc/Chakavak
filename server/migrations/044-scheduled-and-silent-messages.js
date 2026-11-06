/**
 * Migration 044: Scheduled and Silent Messages.
 *
 * Adds `is_silent` column to `chat_messages` table to support silent deliveries,
 * and creates `scheduled_messages` table to queue messages scheduled for future dispatch.
 */
export const migration044ScheduledAndSilentMessages = {
  version: 44,
  up: ({ db, hasColumn, tableExists }) => {
    if (!hasColumn("chat_messages", "is_silent")) {
      db.run(
        "ALTER TABLE chat_messages ADD COLUMN is_silent INTEGER NOT NULL DEFAULT 0",
      );
    }

    if (!tableExists("scheduled_messages")) {
      db.run(`
        CREATE TABLE IF NOT EXISTS scheduled_messages (
          id TEXT PRIMARY KEY,
          chat_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          body TEXT NOT NULL,
          scheduled_at TEXT NOT NULL,
          is_silent INTEGER NOT NULL DEFAULT 0,
          reply_to_message_id TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
    }

    db.run(
      "CREATE INDEX IF NOT EXISTS idx_scheduled_messages_chat_user ON scheduled_messages(chat_id, user_id)",
    );
    db.run(
      "CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled_at ON scheduled_messages(scheduled_at)",
    );
  },
};
