// server/src/controllers/systemOwner/systemOwnerActivityController.js
import ActivityLog from "../models/ActivityLog.js";
import User from "../models/User.js";

/* ==========================================================
   SO.Activity — LIST ACTIVITY LOGS (System Owner)
   GET /api/owner/activity/logs
   Query:
     - page, limit
     - action (optional)
     - email  (optional, search by user email)
     - from, to (ISO dates, optional)
========================================================== */
export const getOwnerActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      action,
      email,
      from,
      to,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);

    const filter = {};

    if (action) {
      filter.action = action;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    // If email filter provided, resolve userIds first
    let userIds = null;
    if (email) {
      const users = await User.find({
        email: { $regex: email, $options: "i" },
      }).select("_id");
      userIds = users.map((u) => u._id);
      filter.userId = { $in: userIds };
    }

    const total = await ActivityLog.countDocuments(filter);

    const logs = await ActivityLog.find(filter)
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.json({
      ok: true,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      logs,
    });
  } catch (err) {
    console.error("getOwnerActivityLogs error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error loading activity logs." });
  }
};
