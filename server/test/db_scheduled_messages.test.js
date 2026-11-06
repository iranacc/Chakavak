import { describe, test, expect, beforeAll } from "vitest";
import { migration044ScheduledAndSilentMessages } from "../migrations/044-scheduled-and-silent-messages.js";
import {
  createUser,
  createChat,
  createMessage,
  createScheduledMessage,
  getScheduledMessages,
  getScheduledMessageById,
  getDueScheduledMessages,
  updateScheduledMessageTime,
  deleteScheduledMessage,
  getMessages,
} from "../db.js";

describe("Migration 044 - Scheduled and Silent Messages", () => {
  test("defines migration 044 with version 44", () => {
    expect(migration044ScheduledAndSilentMessages.version).toBe(44);
    expect(typeof migration044ScheduledAndSilentMessages.up).toBe("function");
  });

  test("runs migration up callback", () => {
    const executed = [];
    const mockDb = {
      run: (sql) => executed.push(sql),
    };
    const hasColumn = () => false;
    const tableExists = () => false;
    migration044ScheduledAndSilentMessages.up({ db: mockDb, hasColumn, tableExists });
    expect(executed.some((sql) => sql.includes("is_silent"))).toBe(true);
    expect(executed.some((sql) => sql.includes("scheduled_messages"))).toBe(true);
  });
});

describe("DB Scheduled and Silent Messages", () => {
  let userId, chatId;

  beforeAll(async () => {
    userId = createUser(`sched_u_${Date.now()}`, "pass123");
    chatId = await createChat("Sched Group", "group");
  });

  test("creates a silent message and retrieves is_silent flag", async () => {
    const msgId = await createMessage(
      chatId,
      userId,
      "This is a silent message",
      null,
      null,
      null,
      { isSilent: true },
    );
    expect(msgId).toBeTruthy();

    const result = await getMessages(chatId, { limit: 10 });
    const found = result.messages.find((m) => m.id === msgId);
    expect(found).toBeDefined();
    expect(Boolean(found.is_silent)).toBe(true);
  });

  test("creates scheduled message and retrieves it by chat and user", async () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const sched = await createScheduledMessage({
      chatId,
      userId,
      body: "Future reminder text",
      scheduledAt: futureDate,
      isSilent: true,
    });

    expect(sched).toBeDefined();
    expect(sched.id).toBeTruthy();
    expect(sched.body).toBe("Future reminder text");
    expect(sched.is_silent).toBe(true);

    const list = await getScheduledMessages(chatId, userId);
    expect(list.some((s) => s.id === sched.id)).toBe(true);

    const single = await getScheduledMessageById(sched.id);
    expect(single).not.toBeNull();
    expect(single.body).toBe("Future reminder text");
  });

  test("finds due scheduled messages based on timestamp", async () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    const sched = await createScheduledMessage({
      chatId,
      userId,
      body: "Overdue message ready to send",
      scheduledAt: pastDate,
      isSilent: false,
    });

    const dueList = await getDueScheduledMessages(new Date().toISOString());
    expect(dueList.some((s) => s.id === sched.id)).toBe(true);
  });

  test("updates scheduled time and deletes scheduled message", async () => {
    const futureDate = new Date(Date.now() + 100000).toISOString();
    const sched = await createScheduledMessage({
      chatId,
      userId,
      body: "To be modified and cancelled",
      scheduledAt: futureDate,
    });

    const newDate = new Date(Date.now() + 200000).toISOString();
    const updated = await updateScheduledMessageTime(sched.id, userId, newDate);
    expect(updated).toBe(true);

    const retrieved = await getScheduledMessageById(sched.id);
    expect(retrieved.scheduled_at).toBe(newDate);

    const deleted = await deleteScheduledMessage(sched.id, userId);
    expect(deleted).toBe(true);

    const afterDelete = await getScheduledMessageById(sched.id);
    expect(afterDelete).toBeNull();
  });
});
