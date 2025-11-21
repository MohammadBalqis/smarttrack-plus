// server/src/controllers/sessionController.js
import Session from "../models/Session.js";

/* ==========================================================
   👤 Get all my sessions (current user)
========================================================== */
export const getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ok: true,
      count: sessions.length,
      sessions: sessions.map((s) => ({
        id: s._id,
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        ipAddress: s.ipAddress,
        isCurrent:
          req.session && String(req.session._id) === String(s._id),
        isActive: s.isActive && !s.isRevoked,
        createdAt: s.createdAt,
        lastActivityAt: s.lastActivityAt,
      })),
    });
  } catch (err) {
    console.error("❌ getMySessions error:", err.message);
    res.status(500).json({ error: "Error loading sessions" });
  }
};

/* ==========================================================
   ❌ Revoke a single session (logout that device)
========================================================== */
export const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.isActive = false;
    session.isRevoked = true;
    await session.save();

    res.json({ ok: true, message: "Session revoked" });
  } catch (err) {
    console.error("❌ revokeSession error:", err.message);
    res.status(500).json({ error: "Error revoking session" });
  }
};

/* ==========================================================
   🔐 Logout from all other devices
========================================================== */
export const revokeOtherSessions = async (req, res) => {
  try {
    const currentSessionId = req.session?._id;

    await Session.updateMany(
      {
        userId: req.user._id,
        _id: { $ne: currentSessionId },
        isActive: true,
        isRevoked: false,
      },
      { isActive: false, isRevoked: true }
    );

    res.json({ ok: true, message: "Other sessions logged out" });
  } catch (err) {
    console.error("❌ revokeOtherSessions error:", err.message);
    res.status(500).json({ error: "Error logging out other sessions" });
  }
};
