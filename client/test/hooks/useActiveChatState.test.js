import { describe, test, expect } from "vitest";
import React from "react";
import { useActiveChatState } from "../../src/hooks/chat/useActiveChatState.js";

describe("useActiveChatState logic", () => {
  // Set dispatcher for React 19 in Node environment
  if (React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE) {
    React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H = {
      useMemo: (fn) => fn(),
      useEffect: () => {},
    };
  }

  const dummyChats = [
    { id: 1, type: "dm", members: [{ username: "alice" }, { username: "bob" }] },
    { id: 2, type: "group", name: "Developers" },
    { id: 3, type: "channel", name: "Announcements" },
    { id: 4, type: "dm", members: [{ username: "charlie" }, { username: "bob" }] },
  ];

  test("returns all unarchived chats by default with chatFolder='all'", () => {
    const activeChatIdRef = { current: null };
    const activeChatTypeRef = { current: null };
    const result = useActiveChatState({
      chats: dummyChats,
      chatsSearchQuery: "",
      user: { username: "bob" },
      activeChatId: null,
      activeChatIdRef,
      activeChatTypeRef,
      activePeer: null,
      chatFolder: "all",
      archivedChatIds: [4],
    });
    // Should filter out archived chat id 4
    expect(result.visibleChats.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  test("filters by personal folder", () => {
    const activeChatIdRef = { current: null };
    const activeChatTypeRef = { current: null };
    const result = useActiveChatState({
      chats: dummyChats,
      chatsSearchQuery: "",
      user: { username: "bob" },
      activeChatId: null,
      activeChatIdRef,
      activeChatTypeRef,
      activePeer: null,
      chatFolder: "personal",
      archivedChatIds: [],
    });
    expect(result.visibleChats.map((c) => c.id)).toEqual([1, 4]);
  });

  test("filters by archived folder", () => {
    const activeChatIdRef = { current: null };
    const activeChatTypeRef = { current: null };
    const result = useActiveChatState({
      chats: dummyChats,
      chatsSearchQuery: "",
      user: { username: "bob" },
      activeChatId: null,
      activeChatIdRef,
      activeChatTypeRef,
      activePeer: null,
      chatFolder: "archived",
      archivedChatIds: [4],
    });
    expect(result.visibleChats.map((c) => c.id)).toEqual([4]);
  });
});
