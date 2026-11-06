import { describe, test, expect, vi } from "vitest";
import request from "supertest";
import { makeApp } from "./helpers/makeApp.js";

describe("E2EE Secret Chat API endpoints", () => {
  test("POST /api/e2ee/keys stores key and broadcasts event", async () => {
    const mockSetChatE2eeKey = vi.fn().mockReturnValue(true);
    const mockEmitChatEvent = vi.fn();

    const appObj = makeApp({
      deps: {
        requireSession: () => ({ id: "u1", userId: "u1", username: "alice" }),
        isMember: (chatId, userId) => chatId === "chat-123" && userId === "u1",
        setChatE2eeKey: mockSetChatE2eeKey,
        emitChatEvent: mockEmitChatEvent,
      },
    });

    const res = await request(appObj.app)
      .post("/api/e2ee/keys")
      .send({
        chatId: "chat-123",
        publicKey: "base64-alice-public-key",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(mockSetChatE2eeKey).toHaveBeenCalledWith("chat-123", "u1", "base64-alice-public-key");
    expect(mockEmitChatEvent).toHaveBeenCalledWith("chat-123", "e2ee_key_exchange", {
      chatId: "chat-123",
      userId: "u1",
      publicKey: "base64-alice-public-key",
    });
  });

  test("GET /api/e2ee/keys/:chatId retrieves stored keys", async () => {
    const validUuid = "11111111-1111-4111-8111-111111111111";
    const appObj = makeApp({
      deps: {
        requireSession: () => ({ id: "u1", userId: "u1", username: "alice" }),
        isMember: () => true,
        getChatE2eeKeys: (chatId) => [
          { chat_id: chatId, user_id: "u1", public_key: "pub-key-1" },
          { chat_id: chatId, user_id: "u2", public_key: "pub-key-2" },
        ],
      },
    });

    const res = await request(appObj.app).get(`/api/e2ee/keys/${validUuid}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.keys)).toBe(true);
    expect(res.body.keys.length).toBe(2);
    expect(res.body.keys[0].public_key).toBe("pub-key-1");
  });

  test("POST /api/chats/dm creates secret chat when isSecret is true", async () => {
    let createdType = null;
    const appObj = makeApp({
      deps: {
        requireSession: () => ({ id: "u1", userId: "u1", username: "alice" }),
        requireSessionUsernameMatch: () => true,
        findUserByUsername: (uname) => ({ id: uname === "alice" ? "u1" : "u2", username: uname }),
        findDmChat: (u1, u2, chatType) => null,
        createChat: (name, type) => {
          createdType = type;
          return "secret-chat-id";
        },
        addChatMember: () => {},
      },
    });

    const res = await request(appObj.app)
      .post("/api/chats/dm")
      .send({
        from: "alice",
        to: "bob",
        isSecret: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("secret-chat-id");
    expect(res.body.type).toBe("secret");
    expect(createdType).toBe("secret");
  });
});
