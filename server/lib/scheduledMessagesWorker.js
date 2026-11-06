/**
 * Scheduled Messages Worker
 *
 * Periodically polls for due scheduled messages, publishes them to the chat,
 * emits real-time SSE events, and cleans up dispatched entries.
 */

export function createScheduledMessagesWorker(deps) {
  const {
    getDueScheduledMessages,
    deleteScheduledMessage,
    messagePubService,
    emitChatEvent,
    findUserById,
    isUserConnected = () => false,
    debugLog = () => {},
  } = deps;

  let timer = null;
  let isProcessing = false;

  async function processDueMessages() {
    if (isProcessing) return 0;
    isProcessing = true;

    try {
      const nowIso = new Date().toISOString();
      const rawDue = getDueScheduledMessages(nowIso);
      const dueMessages = rawDue && typeof rawDue.then === "function" ? await rawDue : rawDue;

      if (!Array.isArray(dueMessages) || dueMessages.length === 0) {
        return 0;
      }

      let processedCount = 0;

      for (const item of dueMessages) {
        try {
          const rawUser = findUserById(item.user_id);
          const user = rawUser && typeof rawUser.then === "function" ? await rawUser : rawUser;

          const rawResult = messagePubService.publishTextMessage({
            chatId: item.chat_id,
            userId: item.user_id,
            body: item.body,
            replyToMessageId: item.reply_to_message_id,
            isSilent: Boolean(item.is_silent),
            username: user?.username || "",
            isUserConnectedFn: isUserConnected,
          });

          const result = rawResult && typeof rawResult.then === "function" ? await rawResult : rawResult;

          // Delete from scheduled messages
          const rawDel = deleteScheduledMessage(item.id);
          if (rawDel && typeof rawDel.then === "function") await rawDel;

          // Broadcast SSE events
          if (Array.isArray(result?.sseEvents)) {
            result.sseEvents.forEach((ev) => {
              emitChatEvent(ev.chatId, {
                ...ev.payload,
                is_silent: Boolean(item.is_silent),
              });
            });
          }

          // Emit scheduled_messages_updated event for the chat
          emitChatEvent(item.chat_id, {
            type: "scheduled_messages_updated",
            chatId: item.chat_id,
            userId: item.user_id,
          });

          processedCount++;
        } catch (err) {
          debugLog("scheduled-worker:error", { id: item.id, error: err?.message });
        }
      }

      return processedCount;
    } catch (err) {
      debugLog("scheduled-worker:poll-error", { error: err?.message });
      return 0;
    } finally {
      isProcessing = false;
    }
  }

  function start(intervalMs = 5000) {
    if (timer) return;
    timer = setInterval(() => {
      void processDueMessages();
    }, intervalMs);
    // Unref timer so it doesn't prevent graceful process exit
    if (typeof timer.unref === "function") {
      timer.unref();
    }
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return {
    processDueMessages,
    start,
    stop,
  };
}
