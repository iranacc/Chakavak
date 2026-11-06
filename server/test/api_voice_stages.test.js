import { describe, test, expect, vi } from "vitest";
import request from "supertest";
import { makeApp } from "./helpers/makeApp.js";

describe("Voice Stages API endpoints", () => {
  const validUuid = "22222222-2222-4222-8222-222222222222";

  test("GET /api/calls/stages/active returns active stages", async () => {
    const appObj = makeApp();
    const res = await request(appObj.app).get("/api/calls/stages/active");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.stages)).toBe(true);
  });

  test("full voice stage workflow: start -> join -> raise hand -> leave", async () => {
    const mockEmitChatEvent = vi.fn();
    const appObj = makeApp({
      deps: {
        requireSession: () => ({ id: "u-alice", userId: "u-alice", username: "alice" }),
        isMember: () => true,
        emitChatEvent: mockEmitChatEvent,
      },
    });

    // 1. Start stage
    const startRes = await request(appObj.app)
      .post("/api/calls/stage/start")
      .send({ chatId: validUuid, title: "اتاق گفتگوی آزاد" });

    expect(startRes.status).toBe(200);
    expect(startRes.body.ok).toBe(true);
    expect(startRes.body.stage.title).toBe("اتاق گفتگوی آزاد");
    expect(startRes.body.stage.participantCount).toBe(1);

    // 2. Query stage status
    const getRes = await request(appObj.app).get(`/api/calls/stage/${validUuid}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.active).toBe(true);
    expect(getRes.body.stage.title).toBe("اتاق گفتگوی آزاد");

    // 3. Bob joins
    const bobApp = makeApp({
      deps: {
        requireSession: () => ({ id: "u-bob", userId: "u-bob", username: "bob" }),
        isMember: () => true,
        voiceStageManager: appObj.deps?.voiceStageManager, // will be created inside if not injected
      },
    });

    // 4. Raise hand
    const handRes = await request(appObj.app)
      .post("/api/calls/stage/raise-hand")
      .send({ chatId: validUuid, raised: true });

    expect(handRes.status).toBe(200);
    expect(handRes.body.stage.raisedHands).toContain("u-alice");

    // 5. Leave
    const leaveRes = await request(appObj.app)
      .post("/api/calls/stage/leave")
      .send({ chatId: validUuid });

    expect(leaveRes.status).toBe(200);
    expect(leaveRes.body.ok).toBe(true);

    // 6. Stage is now ended
    const afterLeave = await request(appObj.app).get(`/api/calls/stage/${validUuid}`);
    expect(afterLeave.body.active).toBe(false);
  });
});
