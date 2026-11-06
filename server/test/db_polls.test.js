import { describe, test, expect, beforeAll } from "vitest";
import { migration043Polls } from "../migrations/043-polls.js";
import {
  createUser,
  createChat,
  createMessage,
  createPoll,
  getPollByMessageId,
  votePoll,
  closePoll,
} from "../db.js";

describe("Migration 043 - polls", () => {
  test("defines migration 043 with version 43", () => {
    expect(migration043Polls.version).toBe(43);
    expect(typeof migration043Polls.up).toBe("function");
  });

  test("runs migration up callback", () => {
    const executed = [];
    const mockDb = {
      run: (sql) => executed.push(sql),
    };
    const tableExists = () => false;
    migration043Polls.up({ db: mockDb, tableExists });
    expect(executed.some((sql) => sql.includes("polls"))).toBe(true);
    expect(executed.some((sql) => sql.includes("poll_votes"))).toBe(true);
  });
});

describe("DB Polls and Quizzes", () => {
  let user1Id, user2Id, chatId, messageId, pollId;

  beforeAll(async () => {
    user1Id = createUser(`poll_u1_${Date.now()}`, "pass123");
    user2Id = createUser(`poll_u2_${Date.now()}`, "pass123");
    chatId = await createChat("Poll Group", "group");
    messageId = await createMessage(chatId, user1Id, "Which frontend framework?");

    pollId = createPoll({
      messageId,
      chatId,
      creatorId: user1Id,
      question: "Which frontend framework do you prefer?",
      options: ["React", "Vue", "Svelte"],
      multipleChoice: false,
      isAnonymous: false,
    });
  });

  test("creates and retrieves a poll", () => {
    const poll = getPollByMessageId(messageId);
    expect(poll).not.toBeNull();
    expect(poll.question).toBe("Which frontend framework do you prefer?");
    expect(poll.options.length).toBe(3);
    expect(poll.totalVoters).toBe(0);
  });

  test("records user votes accurately", () => {
    const updated = votePoll(pollId, user2Id, [0]); // votes for React
    expect(updated).not.toBeNull();
    expect(updated.totalVoters).toBe(1);
    expect(updated.optionVotes[0]).toBe(1);
    expect(updated.optionVotes[1]).toBe(0);
  });

  test("allows closing a poll", () => {
    const closed = closePoll(pollId, user1Id);
    expect(closed.isClosed).toBe(true);

    const voteAfterClose = votePoll(pollId, user1Id, [1]);
    expect(voteAfterClose).toBeNull();
  });
});
