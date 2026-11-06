import { describe, test, expect, vi } from "vitest";
import { createVoiceStageManager } from "../lib/voiceStageManager.js";

describe("Voice Stage Manager", () => {
  test("starts a voice stage and sets starter as speaker", () => {
    const mockEmitChatEvent = vi.fn();
    const manager = createVoiceStageManager({ emitChatEvent: mockEmitChatEvent });

    const alice = { id: "u-alice", username: "alice", nickname: "Alice" };
    const stage = manager.startStage({
      chatId: "chat-100",
      title: "اتاق گفتگوی هفتگی",
      user: alice,
    });

    expect(stage).toBeDefined();
    expect(stage.chatId).toBe("chat-100");
    expect(stage.title).toBe("اتاق گفتگوی هفتگی");
    expect(stage.startedBy.username).toBe("alice");
    expect(stage.participantCount).toBe(1);
    expect(stage.speakerCount).toBe(1);
    expect(stage.speakers[0].id).toBe("u-alice");

    expect(mockEmitChatEvent).toHaveBeenCalledWith(
      "chat-100",
      "voice_stage_started",
      expect.objectContaining({ chatId: "chat-100" })
    );
  });

  test("allows members to join as listeners and raise hand", () => {
    const mockEmitChatEvent = vi.fn();
    const manager = createVoiceStageManager({ emitChatEvent: mockEmitChatEvent });

    const alice = { id: "u-alice", username: "alice" };
    const bob = { id: "u-bob", username: "bob" };

    manager.startStage({ chatId: "chat-200", user: alice });
    const joined = manager.joinStage({ chatId: "chat-200", user: bob });

    expect(joined.participantCount).toBe(2);
    expect(joined.speakerCount).toBe(1);
    expect(joined.listenerCount).toBe(1);

    // Bob raises hand
    const withHand = manager.toggleRaiseHand({ chatId: "chat-200", userId: "u-bob", raised: true });
    expect(withHand.raisedHands).toContain("u-bob");

    // Alice promotes Bob to speaker
    const moderated = manager.moderate({
      chatId: "chat-200",
      targetUserId: "u-bob",
      isSpeaker: true,
    });
    expect(moderated.speakerCount).toBe(2);
    expect(moderated.raisedHands).not.toContain("u-bob");
  });

  test("cleans up stage when all participants leave", () => {
    const mockEmitChatEvent = vi.fn();
    const manager = createVoiceStageManager({ emitChatEvent: mockEmitChatEvent });

    const alice = { id: "u-alice", username: "alice" };
    manager.startStage({ chatId: "chat-300", user: alice });

    const left = manager.leaveStage({ chatId: "chat-300", userId: "u-alice" });
    expect(left).toBe(true);

    expect(manager.getStage("chat-300")).toBeNull();
    expect(mockEmitChatEvent).toHaveBeenCalledWith("chat-300", "voice_stage_ended", {
      chatId: "chat-300",
    });
  });
});
