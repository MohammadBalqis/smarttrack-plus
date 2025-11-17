// server/src/utils/activityLogger.js
import ActivityLog from "../models/ActivityLog.js";

/* ==========================================================
   🧾 GENERIC LOGGER
   - Use logActivity() anywhere (auth, trips, payments, settings, etc.)
   - Does NOT throw — errors are only printed to console
   ========================================================== */

export const logActivity = async (req, options = {}) => {
  try {
    const {
      action,        // required: e.g. "LOGIN_SUCCESS"
      description,   // text for humans
      category,      // e.g. "auth", "trip", "payment", "user", "settings"
      targetModel,   // e.g. "User", "Trip", "Payment"
      targetId,      // ObjectId
      metadata = {}, // extra JSON data
      userId,        // override userId if needed
      role,          // override role if needed
    } = options;

    if (!action) {
      console.warn("logActivity called without action code.");
      return;
    }

    // Try to read data from req if available
    const currentUser = req?.user || null;

    const ipAddress =
      req?.ip ||
      req?.headers?.["x-forwarded-for"] ||
      req?.connection?.remoteAddress ||
      null;

    const userAgent = req?.headers?.["user-agent"] || null;

    await ActivityLog.create({
      userId: userId || currentUser?._id || null,
      role: role || currentUser?.role || "guest",
      action,
      description: description || "",
      category: category || "system",
      targetModel: targetModel || null,
      targetId: targetId || null,
      ipAddress,
      userAgent,
      metadata,
    });
  } catch (err) {
    console.error("❌ Activity log error:", err.message);
  }
};

/* ==========================================================
   🔐 SMALL HELPERS (OPTIONAL)
   - These are just wrappers around logActivity for clarity
   - You can use them or ignore them
   ========================================================== */

export const logAuthEvent = (req, params) =>
  logActivity(req, {
    category: "auth",
    ...params,
  });

export const logTripEvent = (req, params) =>
  logActivity(req, {
    category: "trip",
    targetModel: params.targetModel || "Trip",
    ...params,
  });

export const logPaymentEvent = (req, params) =>
  logActivity(req, {
    category: "payment",
    targetModel: params.targetModel || "Payment",
    ...params,
  });

export const logUserEvent = (req, params) =>
  logActivity(req, {
    category: "user",
    targetModel: params.targetModel || "User",
    ...params,
  });

export const logSettingsEvent = (req, params) =>
  logActivity(req, {
    category: "settings",
    targetModel: params.targetModel || "GlobalSettings",
    ...params,
  });
