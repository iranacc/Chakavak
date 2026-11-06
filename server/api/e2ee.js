import { validateUuidParams } from "../lib/uuidMiddleware.js";

function registerE2eeRoutes(app, deps) {
  const {
    requireSession,
    isMember,
    setChatE2eeKey,
    getChatE2eeKeys,
    emitChatEvent,
  } = deps;

  /**
   * POST /api/e2ee/keys
   * Publish or exchange public key for a chat.
   */
  app.post("/api/e2ee/keys", async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;

    const { chatId, publicKey } = req.body || {};
    if (!chatId || !publicKey) {
      return res.status(400).json({ error: "chatId and publicKey are required." });
    }

    const memberCheck = isMember(chatId, session.userId);
    const hasMembership = memberCheck && typeof memberCheck.then === "function"
      ? await memberCheck
      : memberCheck;

    if (!hasMembership) {
      return res.status(403).json({ error: "You are not a member of this chat." });
    }

    const saveRes = setChatE2eeKey(chatId, session.userId, publicKey);
    if (saveRes && typeof saveRes.then === "function") {
      await saveRes;
    }

    // Real-time broadcast to peer in this chat
    if (typeof emitChatEvent === "function") {
      emitChatEvent(chatId, "e2ee_key_exchange", {
        chatId,
        userId: session.userId,
        publicKey,
      });
    }

    res.json({ ok: true });
  });

  /**
   * GET /api/e2ee/keys/:chatId
   * Retrieve participant public keys for this chat.
   */
  app.get("/api/e2ee/keys/:chatId", validateUuidParams("chatId"), async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;

    const { chatId } = req.params;

    const memberCheck = isMember(chatId, session.userId);
    const hasMembership = memberCheck && typeof memberCheck.then === "function"
      ? await memberCheck
      : memberCheck;

    if (!hasMembership) {
      return res.status(403).json({ error: "You are not a member of this chat." });
    }

    const rawKeys = getChatE2eeKeys(chatId);
    const keys = rawKeys && typeof rawKeys.then === "function" ? await rawKeys : rawKeys;

    res.json({ keys: keys || [] });
  });
}

export { registerE2eeRoutes };
