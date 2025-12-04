import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import Session from "../models/Session.js";

const router = Router();

/* ==========================================================
   🟢 GET MY ACTIVE SESSIONS
========================================================== */
router.get("/my-sessions", protect, async (req, res) => {
  try {
    const sessions = await Session.find({
      userId: req.user._id,
      isActive: true,
    }).sort({ lastActivityAt: -1 });

    res.json({ ok: true, sessions });
  } catch (err) {
    console.error("❌ Get sessions error:", err.message);
    res.status(500).json({ ok: false, error: "Failed to load sessions" });
  }
});

/* ==========================================================
   🟡 DESTROY ONE SESSION
========================================================== */
router.delete("/logout/:sessionId", protect, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ ok: false, error: "Session not found" });
    }

    session.isActive = false;
    session.isRevoked = true;
    await session.save();

    res.json({ ok: true, message: "Session logged out" });
  } catch (err) {
    console.error("❌ Logout session error:", err.message);
    res.status(500).json({ ok: false, error: "Failed to logout this session" });
  }
});

/* ==========================================================
   🔴 LOGOUT ALL OTHERS SESSIONS
========================================================== */
router.delete("/logout-all", protect, async (req, res) => {
  try {
    await Session.updateMany(
      {
        userId: req.user._id,
        _id: { $ne: req.session._id }, // keep current session
      },
      { isActive: false, isRevoked: true }
    );

    res.json({
      ok: true,
      message: "All devices logged out except this one",
    });
  } catch (err) {
    console.error("❌ Logout all error:", err.message);
    res.status(500).json({ ok: false, error: "Failed to logout all" });
  }
});

/* ==========================================================
   🔵 UPDATE LAST ACTIVITY TIMESTAMP (PING)
========================================================== */
router.patch("/ping", protect, async (req, res) => {
  try {
    await Session.findByIdAndUpdate(req.session._id, {
      lastActivityAt: new Date(),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Ping session error:", err.message);
    res.status(200).json({ ok: false });
  }
});

export default router;
