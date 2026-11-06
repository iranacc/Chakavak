import { describe, test, expect } from "vitest";
import request from "supertest";
import { makeApp } from "./helpers/makeApp.js";

describe("POST /api/messages/react", () => {
  test("allows reacting to a message in an authorized chat", async () => {
    let emittedEvent = null;
    const reactionsStore = new Map();

    const appObj = makeApp({
      deps: {
        requireSession: () => ({ id: "u1", username: "react_tester" }),
        isMember: () => true,
        findChatById: () => ({ id: "00000000-0000-0000-0000-000000000001", type: "group" }),
        findMessageById: () => ({ id: "00000000-0000-0000-0000-000000000002", chat_id: "00000000-0000-0000-0000-000000000001" }),
        toggleMessageReaction: (messageId, userId, emoji) => {
          const key = `${messageId}:${emoji}`;
          const has = reactionsStore.has(key);
          if (has) {
            reactionsStore.delete(key);
            return { added: false };
          }
          reactionsStore.set(key, { emoji, userId });
          return { added: true };
        },
        getMessageReactions: (ids) => {
          const res = {};
          ids.forEach((id) => {
            res[id] = Array.from(reactionsStore.values());
          });
          return res;
        },
        emitChatEvent: (chatId, evt) => {
          emittedEvent = evt;
        },
      },
    });

    const res = await request(appObj.app)
      .post("/api/messages/react")
      .send({
        chatId: "00000000-0000-0000-0000-000000000001",
        messageId: "00000000-0000-0000-0000-000000000002",
        emoji: "🔥",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.added).toBe(true);
    expect(emittedEvent).not.toBeNull();
    expect(emittedEvent.type).toBe("message_reaction");
    expect(emittedEvent.emoji).toBe("🔥");
  });

  test("rejects request if emoji is missing", async () => {
    const appObj = makeApp({
      deps: {
        requireSession: () => ({ id: "u1", username: "react_tester" }),
        isMember: () => true,
        findChatById: () => ({ id: "00000000-0000-0000-0000-000000000001", type: "group" }),
        findMessageById: () => ({ id: "00000000-0000-0000-0000-000000000002", chat_id: "00000000-0000-0000-0000-000000000001" }),
      },
    });

    const res = await request(appObj.app)
      .post("/api/messages/react")
      .send({
        chatId: "00000000-0000-0000-0000-000000000001",
        messageId: "00000000-0000-0000-0000-000000000002",
        emoji: "",
      });

    expect(res.status).toBe(400);
  });
});
