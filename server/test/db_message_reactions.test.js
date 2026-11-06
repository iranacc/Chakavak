import { describe, test, expect, beforeAll } from "vitest";
import { migration042MessageReactions } from "../migrations/042-message-reactions.js";
import {
  createUser,
  createChat,
  createMessage,
  addMessageReaction,
  removeMessageReaction,
  toggleMessageReaction,
  getMessageReactions,
} from "../db.js";

describe("Migration 042 - message_reactions", () => {
  test("defines migration 042 with version 42", () => {
    expect(migration042MessageReactions.version).toBe(42);
    expect(typeof migration042MessageReactions.up).toBe("function");
  });

  test("runs migration up callback", () => {
    const executed = [];
    const mockDb = {
      run: (sql) => executed.push(sql),
    };
    const tableExists = () => false;
    migration042MessageReactions.up({ db: mockDb, tableExists });
    expect(executed.some((sql) => sql.includes("message_reactions"))).toBe(true);
  });
});

describe("DB Message Reactions", () => {
  let user1Id, user2Id, chatId, messageId;

  beforeAll(async () => {
    user1Id = createUser(`react_user1_${Date.now()}`, "pass123");
    user2Id = createUser(`react_user2_${Date.now()}`, "pass123");
    chatId = await createChat("Reactions Group", "group", {
      groupVisibility: "public",
    });
    // createMessage returns the messageId directly
    messageId = await createMessage(chatId, user1Id, "Hello with reactions!");
  });

  test("adds a reaction to a message", () => {
    const success = addMessageReaction(messageId, user1Id, "👍");
    expect(success).toBe(true);

    const reactions = getMessageReactions([messageId]);
    expect(reactions[messageId]).toBeDefined();
    expect(reactions[messageId].length).toBe(1);
    expect(reactions[messageId][0].emoji).toBe("👍");
    expect(reactions[messageId][0].userId).toBe(user1Id);
  });

  test("removes a reaction", () => {
    const removed = removeMessageReaction(messageId, user1Id, "👍");
    expect(removed).toBe(true);

    const reactions = getMessageReactions([messageId]);
    expect(reactions[messageId].length).toBe(0);
  });

  test("toggles reactions on and off", () => {
    const res1 = toggleMessageReaction(messageId, user2Id, "❤️");
    expect(res1.added).toBe(true);

    let reactions = getMessageReactions([messageId]);
    expect(reactions[messageId].length).toBe(1);
    expect(reactions[messageId][0].emoji).toBe("❤️");

    const res2 = toggleMessageReaction(messageId, user2Id, "❤️");
    expect(res2.added).toBe(false);

    reactions = getMessageReactions([messageId]);
    expect(reactions[messageId].length).toBe(0);
  });
});
