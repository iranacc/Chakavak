import { describe, test, expect, vi } from "vitest";
import { createScheduledMessagesWorker } from "../lib/scheduledMessagesWorker.js";

describe("ScheduledMessagesWorker", () => {
  test("processes due scheduled messages and dispatches them", async () => {
    const dueMessage = {
      id: "sched_1",
      chat_id: "c1",
      user_id: "u1",
      body: "Scheduled reminder text",
      reply_to_message_id: null,
      is_silent: true,
    };

    let deletedId = null;
    let publishedPayload = null;
    const emittedEvents = [];

    const worker = createScheduledMessagesWorker({
      getDueScheduledMessages: async () => [dueMessage],
      deleteScheduledMessage: async (id) => {
        deletedId = id;
        return true;
      },
      findUserById: async () => ({ id: "u1", username: "tester" }),
      messagePubService: {
        publishTextMessage: async (params) => {
          publishedPayload = params;
          return {
            messageId: "msg_dispatched_1",
            sseEvents: [
              {
                chatId: params.chatId,
                payload: {
                  type: "chat_message",
                  chatId: params.chatId,
                  messageId: "msg_dispatched_1",
                  body: params.body,
                  is_silent: params.isSilent,
                },
              },
            ],
            pushRecipients: [],
          };
        },
      },
      emitChatEvent: (chatId, evt) => {
        emittedEvents.push({ chatId, evt });
      },
    });

    const count = await worker.processDueMessages();
    expect(count).toBe(1);
    expect(deletedId).toBe("sched_1");
    expect(publishedPayload.body).toBe("Scheduled reminder text");
    expect(publishedPayload.isSilent).toBe(true);
    expect(emittedEvents.some((e) => e.evt.type === "chat_message")).toBe(true);
  });
});
