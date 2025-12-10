import DriverNotification from "../models/DriverNotification.js";
import GlobalSettings from "../models/GlobalSettings.js";
import { io } from "../../server.js";

/* ==========================================================
   🛡 Maintenance Guard
========================================================== */
const ensureNotInMaintenance = async (req, res) => {
  const settings = await GlobalSettings.findOne();

  if (settings?.maintenanceMode && req.user.role !== "superadmin") {
    res.status(503).json({
      ok: false,
      error: "System is under maintenance",
    });
    return false;
  }
  return true;
};

/* ==========================================================
   🔔 REUSABLE — Create Driver Notification
========================================================== */
export const createDriverNotification = async (driverId, data) => {
  try {
    const notification = await DriverNotification.create({
      driverId,
      type: data.type,
      message: data.message,
      tripId: data.tripId || null,
    });

    // 🔵 Real-time push
    io.to(`driver_${driverId}`).emit("driver:notification:new", {
      id: notification._id,
      type: notification.type,
      message: notification.message,
      tripId: notification.tripId,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (err) {
    console.error("❌ createDriverNotification error:", err.message);
  }
};

/* ==========================================================
   📌 D8.5 — Get ALL Notifications
========================================================== */
export const getDriverNotifications = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    if (req.user.role !== "driver")
      return res.status(403).json({ ok: false, error: "Driver only" });

    const driverId = req.user._id;
    const unreadOnly = req.query.unreadOnly === "true";

    const filter = { driverId };
    if (unreadOnly) filter.isRead = false;

    const notifications = await DriverNotification.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const unreadCount = await DriverNotification.countDocuments({
      driverId,
      isRead: false,
    });

    res.json({ ok: true, notifications, unreadCount });
  } catch (err) {
    console.error("getDriverNotifications error:", err);
    res.status(500).json({ ok: false, error: "Failed loading notifications" });
  }
};

/* ==========================================================
   📌 D8.5 — Mark ALL as Read
========================================================== */
export const markAllDriverNotificationsRead = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    if (req.user.role !== "driver")
      return res.status(403).json({ ok: false, error: "Driver only" });

    await DriverNotification.updateMany(
      { driverId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ ok: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error("markAllDriverNotificationsRead error:", err);
    res.status(500).json({ ok: false, error: "Marking notifications failed" });
  }
};

/* ==========================================================
   OPTIONAL — Delete ONE notification
========================================================== */
export const deleteDriverNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await DriverNotification.findOneAndDelete({
      _id: id,
      driverId: req.user._id,
    });

    if (!deleted)
      return res.status(404).json({ ok: false, error: "Notification not found" });

    res.json({ ok: true, message: "Deleted successfully" });
  } catch (err) {
    console.error("deleteDriverNotification error:", err);
    res.status(500).json({ ok: false, error: "Server error deleting item" });
  }
};

/* ==========================================================
   OPTIONAL — Delete ALL notifications
========================================================== */
export const deleteAllDriverNotifications = async (req, res) => {
  try {
    await DriverNotification.deleteMany({ driverId: req.user._id });

    res.json({ ok: true, message: "All notifications removed" });
  } catch (err) {
    console.error("deleteAllDriverNotifications error:", err);
    res.status(500).json({ ok: false, error: "Failed deleting all" });
  }
};
