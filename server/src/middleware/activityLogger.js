import ActivityLog from "../models/ActivityLog.js";

export const logActivity = async (req, action, description, extra = {}) => {
  try {
    await ActivityLog.create({
      userId: req.user?._id || null,
      role: req.user?.role || "guest",
      action,
      description,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      ...extra,
    });
  } catch (err) {
    console.error("⚠ Activity log error:", err.message);
  }
};
