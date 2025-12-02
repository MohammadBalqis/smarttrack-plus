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
    }).sort({ lastActiveAt: -1 });

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
    await session.save();

    res.json({ ok: true, message: "Session logged out" });
  } catch (err) {
    console.error("❌ Logout session error:", err.message);
    res.status(500).json({ ok: false, error: "Failed to logout this session" });
  }
});

/* ==========================================================
   🔴 LOGOUT ALL (EXCEPT CURRENT)
========================================================== */
router.delete("/logout-all", protect, async (req, res) => {
  try {
    await Session.updateMany(
      {
        userId: req.user._id,
        _id: { $ne: req.sessionId }, // keep current
      },
      { isActive: false }
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
   🔵 PING — UPDATE LAST ACTIVITY
========================================================== */
router.patch("/ping", protect, async (req, res) => {
  try {
    await Session.findByIdAndUpdate(req.sessionId, {
      lastActiveAt: new Date(),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Ping session error:", err.message);
  }
});

export default router;
