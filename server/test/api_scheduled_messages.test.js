import { describe, test, expect } from "vitest";
import request from "supertest";
import { makeApp } from "./helpers/makeApp.js";

describe("API Scheduled and Silent Messages Endpoints", () => {
  test("POST /api/messages supports isSilent flag", async () => {
    let publishedSilent = null;

    const appObj = makeApp({
      deps: {
        requireSession: () => ({ id: "u1", username: "silent_tester" }),
        findUserByUsername: () => ({ id: "u1", username: "silent_tester" }),
        isMember: () => true,
        findChatById: () => ({ id: "00000000-0000-0000-0000-000000000001", type: "dm" }),
        createOrReuseMessage: (chatId, userId, body, replyTo, expires, clientReqId, options) => {
          publishedSilent = options?.isSilent;
          return { id: "msg_silent_123", deduped: false };
        },
      },
    });

    const res = await request(appObj.app)
      .post("/api/messages")
      .send({
        chatId: "00000000-0000-0000-0000-000000000001",
        username: "silent_tester",
        body: "Hello silently!",
        isSilent: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("msg_silent_123");
    expect(publishedSilent).toBe(true);
  });

  test("POST /api/messages/schedule queues a future scheduled message", async () => {
    let createdSched = null;
    let eventEmitted = null;

    const appObj = makeApp({
      deps: {
        requireSession: () => ({ id: "u1", username: "sched_tester" }),
        isMember: () => true,
        createScheduledMessage: async (params) => {
          createdSched = params;
          return { id: "sched_1", ...params };
        },
        emitChatEvent: (chatId, evt) => {
          eventEmitted = evt;
        },
      },
    });

    const futureDate = new Date(Date.now() + 600000).toISOString();
    const res = await request(appObj.app)
      .post("/api/messages/schedule")
      .send({
        chatId: "00000000-0000-0000-0000-000000000001",
        body: "Reminder to review code",
        scheduledAt: futureDate,
        isSilent: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(createdSched).not.toBeNull();
    expect(createdSched.body).toBe("Reminder to review code");
    expect(createdSched.isSilent).toBe(true);
    expect(eventEmitted?.type).toBe("scheduled_messages_updated");
  });

  test("GET /api/messages/scheduled returns user's scheduled messages", async () => {
    const appObj = makeApp({
      deps: {
        requireSession: () => ({ id: "u1", username: "sched_tester" }),
        isMember: () => true,
        getScheduledMessages: async () => [
          { id: "sched_1", body: "Future message", is_silent: true, scheduled_at: "2026-11-06T15:00:00Z" },
        ],
      },
    });

    const res = await request(appObj.app)
      .get("/api/messages/scheduled?chatId=00000000-0000-0000-0000-000000000001");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.scheduledMessages.length).toBe(1);
    expect(res.body.scheduledMessages[0].body).toBe("Future message");
  });
});
