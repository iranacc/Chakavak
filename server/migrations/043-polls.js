/**
 * Migration 043: Polls & Quizzes support.
 *
 * Adds `polls` and `poll_votes` tables.
 * Polls belong to a message (message_id) and chat (chat_id).
 * Options are stored as JSON array in `options`.
 */
export const migration043Polls = {
  version: 43,
  up: ({ db, tableExists }) => {
    if (!tableExists("polls")) {
      db.run(`
        CREATE TABLE IF NOT EXISTS polls (
          id TEXT PRIMARY KEY,
          message_id TEXT NOT NULL,
          chat_id TEXT NOT NULL,
          creator_id TEXT NOT NULL,
          question TEXT NOT NULL,
          options TEXT NOT NULL,
          multiple_choice INTEGER NOT NULL DEFAULT 0,
          is_anonymous INTEGER NOT NULL DEFAULT 0,
          is_quiz INTEGER NOT NULL DEFAULT 0,
          correct_option_index INTEGER,
          is_closed INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
    }
    db.run("CREATE INDEX IF NOT EXISTS idx_polls_message_id ON polls(message_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_polls_chat_id ON polls(chat_id)");

    if (!tableExists("poll_votes")) {
      db.run(`
        CREATE TABLE IF NOT EXISTS poll_votes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          poll_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          option_index INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(poll_id, user_id, option_index)
        )
      `);
    }
    db.run("CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id)");
  },
};
