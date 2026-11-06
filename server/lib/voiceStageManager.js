/**
 * Voice Stage Manager for چکاوک (Chakavak)
 *
 * Coordinates live, continuous group voice stages / audio rooms (Discord / Telegram Stage style)
 * with participant tracking, hand raises, speaking indicators, and moderation.
 */

export function createVoiceStageManager(deps = {}) {
  const { emitChatEvent } = deps;

  // chatId -> Stage
  const activeStages = new Map();

  /**
   * Starts a voice stage for a group or channel.
   */
  function startStage({ chatId, title = "گفتگوی صوتی زنده", user }) {
    if (!chatId || !user?.id) return null;

    const normalizedChatId = String(chatId).toLowerCase();
    let stage = activeStages.get(normalizedChatId);

    if (!stage) {
      stage = {
        chatId: normalizedChatId,
        title: String(title || "گفتگوی صوتی زنده").trim(),
        startedBy: {
          id: user.id,
          username: user.username,
          nickname: user.nickname || user.display_name || user.username,
        },
        startedAt: new Date().toISOString(),
        speakers: new Set([user.id]),
        raisedHands: new Set(),
        participants: new Map([
          [
            user.id,
            {
              id: user.id,
              username: user.username,
              nickname: user.nickname || user.display_name || user.username,
              avatarUrl: user.avatar_url || user.avatarUrl || null,
              color: user.color || "#10b981",
              isSpeaker: true,
              isMuted: false,
              isRaisedHand: false,
              joinedAt: new Date().toISOString(),
            },
          ],
        ]),
      };
      activeStages.set(normalizedChatId, stage);
    } else {
      // User joins existing
      stage.participants.set(user.id, {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.display_name || user.username,
        avatarUrl: user.avatar_url || user.avatarUrl || null,
        color: user.color || "#10b981",
        isSpeaker: stage.speakers.has(user.id),
        isMuted: false,
        isRaisedHand: stage.raisedHands.has(user.id),
        joinedAt: new Date().toISOString(),
      });
    }

    const payload = formatStage(stage);

    if (typeof emitChatEvent === "function") {
      emitChatEvent(normalizedChatId, "voice_stage_started", {
        chatId: normalizedChatId,
        stage: payload,
      });
    }

    return payload;
  }

  function getStage(chatId) {
    if (!chatId) return null;
    const stage = activeStages.get(String(chatId).toLowerCase());
    return stage ? formatStage(stage) : null;
  }

  function listActiveStages() {
    const list = [];
    for (const stage of activeStages.values()) {
      list.push({
        chatId: stage.chatId,
        title: stage.title,
        participantCount: stage.participants.size,
        startedAt: stage.startedAt,
      });
    }
    return list;
  }

  function joinStage({ chatId, user, asSpeaker = false }) {
    if (!chatId || !user?.id) return null;
    const normalizedChatId = String(chatId).toLowerCase();
    const stage = activeStages.get(normalizedChatId);
    if (!stage) return null;

    const isSpeaker = asSpeaker || stage.speakers.has(user.id) || stage.startedBy.id === user.id;
    if (isSpeaker) {
      stage.speakers.add(user.id);
    }

    stage.participants.set(user.id, {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.display_name || user.username,
      avatarUrl: user.avatar_url || user.avatarUrl || null,
      color: user.color || "#10b981",
      isSpeaker,
      isMuted: !isSpeaker,
      isRaisedHand: stage.raisedHands.has(user.id),
      joinedAt: new Date().toISOString(),
    });

    const payload = formatStage(stage);

    if (typeof emitChatEvent === "function") {
      emitChatEvent(normalizedChatId, "voice_stage_updated", {
        chatId: normalizedChatId,
        stage: payload,
      });
    }

    return payload;
  }

  function leaveStage({ chatId, userId }) {
    if (!chatId || !userId) return false;
    const normalizedChatId = String(chatId).toLowerCase();
    const stage = activeStages.get(normalizedChatId);
    if (!stage) return false;

    stage.participants.delete(userId);
    stage.speakers.delete(userId);
    stage.raisedHands.delete(userId);

    if (stage.participants.size === 0) {
      activeStages.delete(normalizedChatId);
      if (typeof emitChatEvent === "function") {
        emitChatEvent(normalizedChatId, "voice_stage_ended", {
          chatId: normalizedChatId,
        });
      }
      return true;
    }

    const payload = formatStage(stage);
    if (typeof emitChatEvent === "function") {
      emitChatEvent(normalizedChatId, "voice_stage_updated", {
        chatId: normalizedChatId,
        stage: payload,
      });
    }
    return true;
  }

  function toggleRaiseHand({ chatId, userId, raised }) {
    if (!chatId || !userId) return null;
    const normalizedChatId = String(chatId).toLowerCase();
    const stage = activeStages.get(normalizedChatId);
    if (!stage) return null;

    const participant = stage.participants.get(userId);
    if (!participant) return null;

    const isRaised = raised !== undefined ? Boolean(raised) : !stage.raisedHands.has(userId);

    if (isRaised) {
      stage.raisedHands.add(userId);
      participant.isRaisedHand = true;
    } else {
      stage.raisedHands.delete(userId);
      participant.isRaisedHand = false;
    }

    const payload = formatStage(stage);
    if (typeof emitChatEvent === "function") {
      emitChatEvent(normalizedChatId, "voice_stage_updated", {
        chatId: normalizedChatId,
        stage: payload,
      });
    }
    return payload;
  }

  function moderate({ chatId, targetUserId, isSpeaker, isMuted, action }) {
    if (!chatId) return null;
    const normalizedChatId = String(chatId).toLowerCase();
    const stage = activeStages.get(normalizedChatId);
    if (!stage) return null;

    if (action === "end") {
      activeStages.delete(normalizedChatId);
      if (typeof emitChatEvent === "function") {
        emitChatEvent(normalizedChatId, "voice_stage_ended", {
          chatId: normalizedChatId,
        });
      }
      return { ended: true };
    }

    if (targetUserId) {
      const participant = stage.participants.get(targetUserId);
      if (participant) {
        if (typeof isSpeaker === "boolean") {
          participant.isSpeaker = isSpeaker;
          if (isSpeaker) {
            stage.speakers.add(targetUserId);
            stage.raisedHands.delete(targetUserId);
            participant.isRaisedHand = false;
          } else {
            stage.speakers.delete(targetUserId);
          }
        }
        if (typeof isMuted === "boolean") {
          participant.isMuted = isMuted;
        }
      }
    }

    const payload = formatStage(stage);
    if (typeof emitChatEvent === "function") {
      emitChatEvent(normalizedChatId, "voice_stage_updated", {
        chatId: normalizedChatId,
        stage: payload,
      });
    }
    return payload;
  }

  function formatStage(stage) {
    const participantsList = Array.from(stage.participants.values());
    const speakersList = participantsList.filter((p) => p.isSpeaker);
    const listenersList = participantsList.filter((p) => !p.isSpeaker);

    return {
      chatId: stage.chatId,
      title: stage.title,
      startedBy: stage.startedBy,
      startedAt: stage.startedAt,
      participantCount: stage.participants.size,
      speakerCount: speakersList.length,
      listenerCount: listenersList.length,
      participants: participantsList,
      speakers: speakersList,
      raisedHands: Array.from(stage.raisedHands),
    };
  }

  return {
    startStage,
    getStage,
    listActiveStages,
    joinStage,
    leaveStage,
    toggleRaiseHand,
    moderate,
  };
}
