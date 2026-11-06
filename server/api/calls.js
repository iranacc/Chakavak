import { createCallManager } from "../lib/callManager.js";
import { validateUuidBody, validateUuidParams } from "../lib/uuidMiddleware.js";
import { createVoiceStageManager } from "../lib/voiceStageManager.js";

/**
 * Register HTTP routes for WebRTC call setup and signaling fallback.
 */
export function registerCallRoutes(app, deps) {
  const {
    getSessionFromRequest,
    callManager: providedCallManager,
    listCallHistoryForUser,
    findMessageById,
    findChatById,
    isMember,
    hideMessageForUser,
    getSetting,
  } = deps;

  const callManager =
    providedCallManager ||
    createCallManager({
      ...deps,
      emitToUser: deps.emitToUser || deps.emitSseEvent,
    });

  const voiceStageManager =
    deps.voiceStageManager ||
    createVoiceStageManager({
      emitChatEvent: deps.emitChatEvent,
      emitSseEvent: deps.emitSseEvent,
    });

  const requireUser = async (req, res) => {
    if (typeof deps.requireSession === "function") {
      return await deps.requireSession(req, res);
    }
    const rawSession = getSessionFromRequest ? getSessionFromRequest(req) : null;
    const session =
      rawSession && typeof rawSession.then === "function"
        ? await rawSession
        : rawSession;
    if (!session) {
      res.status(401).json({ error: "Not authenticated" });
      return null;
    }
    return session;
  };

  // GET /api/calls/ice-servers
  app.get("/api/calls/ice-servers", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json(await callManager.resolveIceServers());
  });

  // Returns the still-ringing incoming call for the authenticated user.
  app.get("/api/calls/incoming", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const incoming = await callManager.getIncomingCallForUser(user.username);
    res.json({ call: incoming || null });
  });

  // Live-read so admin panel / env changes apply without touching the
  // in-memory callManager.
  const callsEnabled = () =>
    typeof getSetting === "function" ? Boolean(getSetting("CALL")) : true;
  const videoCallsEnabled = () =>
    typeof getSetting === "function" ? Boolean(getSetting("CALL_VIDEO")) : true;

  // POST /api/calls/start
  app.post("/api/calls/start", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { chatId, type } = req.body || {};
    if (!callsEnabled()) {
      return res.status(403).json({ error: "Calls are disabled on this server" });
    }
    if (type === "video" && !videoCallsEnabled()) {
      return res.status(403).json({ error: "Video calls are disabled on this server" });
    }
    const result = await callManager.startCall({ user, chatId, type });
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ ok: true, call: result.call });
  });

  // POST /api/calls/accept
  app.post("/api/calls/accept", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { chatId } = req.body || {};
    const result = await callManager.acceptCall({ user, chatId });
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ ok: true, call: result.call });
  });

  // POST /api/calls/reject
  app.post("/api/calls/reject", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { chatId, reason } = req.body || {};
    const result = await callManager.rejectCall({ user, chatId, reason });
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ ok: true });
  });

  // POST /api/calls/end
  app.post("/api/calls/end", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { chatId } = req.body || {};
    const result = await callManager.endCall({ user, chatId });
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ ok: true });
  });

  // POST /api/calls/offer
  app.post("/api/calls/offer", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { chatId, sdp } = req.body || {};
    const result = await callManager.relaySignal({
      user,
      chatId,
      signalType: "offer",
      payload: { sdp },
    });
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ ok: true });
  });

  // POST /api/calls/answer
  app.post("/api/calls/answer", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { chatId, sdp } = req.body || {};
    const result = await callManager.relaySignal({
      user,
      chatId,
      signalType: "answer",
      payload: { sdp },
    });
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ ok: true });
  });

  // POST /api/calls/ice-candidate
  app.post("/api/calls/ice-candidate", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { chatId, candidate } = req.body || {};
    const result = await callManager.relaySignal({
      user,
      chatId,
      signalType: "ice-candidate",
      payload: { candidate },
    });
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ ok: true });
  });

  // POST /api/calls/camera-state
  app.post("/api/calls/camera-state", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { chatId, cameraOff } = req.body || {};
    const result = await callManager.relaySignal({
      user,
      chatId,
      signalType: "camera-state",
      payload: { cameraOff: cameraOff !== false },
    });
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ ok: true });
  });

  // GET /api/calls/history — call-log entries across the user's DM chats.
  app.get("/api/calls/history", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    if (typeof listCallHistoryForUser !== "function") {
      return res.status(501).json({ error: "Not supported" });
    }
    const rows = await listCallHistoryForUser(user.id);
    res.json({ calls: rows || [] });
  });

  // POST /api/calls/history/delete — remove a call-log entry from own history.
  app.post(
    "/api/calls/history/delete",
    validateUuidBody([{ field: "messageId", required: true }]),
    async (req, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      const { messageId } = req.body || {};
      const awaiting = async (value) =>
        value && typeof value.then === "function" ? await value : value;

      const message = await awaiting(findMessageById?.(messageId));
      if (!message) {
        return res.status(404).json({ error: "Call not found" });
      }
      const rawChat = await awaiting(findChatById?.(message.chat_id));
      if (!rawChat || rawChat.type !== "dm") {
        return res.status(404).json({ error: "Call not found" });
      }
      const member = await awaiting(isMember?.(message.chat_id, user.id));
      if (!member) {
        return res.status(403).json({ error: "Not a member of this chat" });
      }
      if (!String(message.body || "").startsWith("[[call:")) {
        return res.status(400).json({ error: "Not a call entry" });
      }

      await awaiting(hideMessageForUser?.(message.id, user.id));
      res.json({ ok: true, id: message.id });
    },
  );

  // POST /api/calls/conference-token — Get LiveKit token for group video conference
  app.post(
    "/api/calls/conference-token",
    validateUuidBody([{ field: "chatId", required: true }]),
    async (req, res) => {
      const user = await requireUser(req, res);
      if (!user) return;

      const { chatId } = req.body || {};
      const awaiting = async (value) =>
        value && typeof value.then === "function" ? await value : value;

      const chat = await awaiting(findChatById?.(chatId));
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      const member = await awaiting(isMember?.(chatId, user.id));
      if (!member) {
        return res.status(403).json({ error: "Not a member of this chat" });
      }

      const lkUrl = process.env.LIVEKIT_URL || "";
      const lkKey = process.env.LIVEKIT_API_KEY || "";
      const lkSecret = process.env.LIVEKIT_API_SECRET || "";

      if (!lkKey || !lkSecret) {
        return res.status(503).json({
          error: "Group video conference is not configured on this server",
        });
      }

      try {
        const { AccessToken } = await import("livekit-server-sdk");
        const at = new AccessToken(lkKey, lkSecret, {
          identity: user.id,
          name: user.display_name || user.username || "Participant",
        });

        at.addGrant({
          roomJoin: true,
          room: "chat_" + chatId,
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
        });

        const token = await at.toJwt();
        res.json({
          token,
          serverUrl: lkUrl,
          room: "chat_" + chatId,
          chatTitle: chat.title || chat.name || "گروه",
        });
      } catch (err) {
        res.status(500).json({ error: "Failed to generate conference token: " + err.message });
      }
    },
  );


  // ─── Voice Stage / Continuous Audio Rooms ────────────────────────────────

  // GET /api/calls/stages/active
  app.get("/api/calls/stages/active", async (req, res) => {
    res.json({ stages: voiceStageManager.listActiveStages() });
  });

  // GET /api/calls/stage/:chatId
  app.get("/api/calls/stage/:chatId", validateUuidParams("chatId"), async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { chatId } = req.params;
    const stage = voiceStageManager.getStage(chatId);
    res.json({ active: Boolean(stage), stage });
  });

  // POST /api/calls/stage/start
  app.post("/api/calls/stage/start", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { chatId, title } = req.body || {};
    if (!chatId) return res.status(400).json({ error: "chatId is required" });

    const awaiting = async (val) => (val && typeof val.then === "function" ? await val : val);
    const member = await awaiting(isMember?.(chatId, user.id));
    if (!member) return res.status(403).json({ error: "Not a member of this chat" });

    const stage = voiceStageManager.startStage({ chatId, title, user });
    res.json({ ok: true, stage });
  });

  // POST /api/calls/stage/join
  app.post("/api/calls/stage/join", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { chatId } = req.body || {};
    if (!chatId) return res.status(400).json({ error: "chatId is required" });

    const awaiting = async (val) => (val && typeof val.then === "function" ? await val : val);
    const member = await awaiting(isMember?.(chatId, user.id));
    if (!member) return res.status(403).json({ error: "Not a member of this chat" });

    const stage = voiceStageManager.joinStage({ chatId, user });
    if (!stage) return res.status(404).json({ error: "No active voice stage in this chat" });

    let token = null;
    const lkUrl = process.env.LIVEKIT_URL || "";
    const lkKey = process.env.LIVEKIT_API_KEY || "";
    const lkSecret = process.env.LIVEKIT_API_SECRET || "";
    if (lkKey && lkSecret) {
      try {
        const { AccessToken } = await import("livekit-server-sdk");
        const at = new AccessToken(lkKey, lkSecret, {
          identity: user.id,
          name: user.nickname || user.username || "Participant",
        });
        at.addGrant({
          roomJoin: true,
          room: "stage_" + chatId,
          canPublish: stage.speakers.some((s) => s.id === user.id),
          canSubscribe: true,
          canPublishData: true,
        });
        token = await at.toJwt();
      } catch (_) {}
    }

    res.json({ ok: true, stage, token, serverUrl: lkUrl });
  });

  // POST /api/calls/stage/leave
  app.post("/api/calls/stage/leave", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { chatId } = req.body || {};
    if (!chatId) return res.status(400).json({ error: "chatId is required" });

    const left = voiceStageManager.leaveStage({ chatId, userId: user.id });
    res.json({ ok: true, left });
  });

  // POST /api/calls/stage/raise-hand
  app.post("/api/calls/stage/raise-hand", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { chatId, raised } = req.body || {};
    if (!chatId) return res.status(400).json({ error: "chatId is required" });

    const stage = voiceStageManager.toggleRaiseHand({ chatId, userId: user.id, raised });
    res.json({ ok: true, stage });
  });

  // POST /api/calls/stage/moderate
  app.post("/api/calls/stage/moderate", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { chatId, targetUserId, isSpeaker, isMuted, action } = req.body || {};
    if (!chatId) return res.status(400).json({ error: "chatId is required" });

    const result = voiceStageManager.moderate({
      chatId,
      targetUserId,
      isSpeaker,
      isMuted,
      action,
    });
    res.json({ ok: true, ...result });
  });

}
