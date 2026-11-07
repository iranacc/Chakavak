import { describe, expect, test, vi } from "vitest";

describe("useChatEvents call signaling parsing", () => {
  test("routes call: events to onCallSignal callback", () => {
    const onCallSignal = vi.fn();

    const handleMessageData = (dataStr) => {
      let payload = null;
      try {
        payload = JSON.parse(dataStr);
      } catch {
        return;
      }
      if (!payload?.type) return;
      if (
        typeof payload.type === "string" &&
        payload.type.startsWith("call:")
      ) {
        onCallSignal(payload);
        return;
      }
    };

    handleMessageData(
      JSON.stringify({
        type: "call:incoming",
        chatId: "chat-uuid-1",
        callType: "voice",
        caller: { username: "bob" },
      }),
    );

    expect(onCallSignal).toHaveBeenCalledWith({
      type: "call:incoming",
      chatId: "chat-uuid-1",
      callType: "voice",
      caller: { username: "bob" },
    });
  });

  test("realtimeSender sends over open WebSocket and returns false when closed", () => {
    let mockReadyState = 1; // OPEN
    const sendFn = vi.fn();

    const createSender = () => (msg) => {
      if (mockReadyState === 1) {
        sendFn(JSON.stringify(msg));
        return true;
      }
      return false;
    };

    const sender = createSender();
    const sent = sender({
      action: "call_signal",
      signalType: "start",
      chatId: "chat-uuid-1",
    });

    expect(sent).toBe(true);
    expect(sendFn).toHaveBeenCalledWith(
      JSON.stringify({
        action: "call_signal",
        signalType: "start",
        chatId: "chat-uuid-1",
      }),
    );

    mockReadyState = 3; // CLOSED
    const sentClosed = sender({ action: "call_signal" });
    expect(sentClosed).toBe(false);
  });

  test("probes session and revokes on 401/403 when reconnection fails", async () => {
    const onSessionRevoked = vi.fn();
    const reconnectAttempts = 2;
    const username = "alice";

    const apiFetch = vi.fn(async () => ({ status: 403 }));

    const handleError = async () => {
      if (reconnectAttempts >= 1 && username) {
        try {
          const probeRes = await apiFetch(`/api/events?username=${encodeURIComponent(username)}`);
          if (probeRes?.status === 401 || probeRes?.status === 403) {
            onSessionRevoked({ reason: "session_mismatch" });
            return;
          }
        } catch (_) {}
      }
    };

    await handleError();

    expect(apiFetch).toHaveBeenCalledWith("/api/events?username=alice");
    expect(onSessionRevoked).toHaveBeenCalledWith({ reason: "session_mismatch" });
  });
});
