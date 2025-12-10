// server/src/utils/notify.js
import Notification from "../models/Notification.js";
import User from "../models/User.js";

/* ==========================================================
   Helper: emit over Socket.IO (if configured)
   - We assume you set: app.set("io", ioInstance) in server.js
========================================================== */
const emitSocketNotification = (req, notif) => {
  try {
    const io = req.app?.get("io");
    if (!io) return;

    const room = String(notif.recipientId);
    io.to(room).emit("notification:new", {
      _id: notif._id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      category: notif.category,
      priority: notif.priority,
      actionUrl: notif.actionUrl || notif.link || null,
      image: notif.image || null,
      meta: notif.meta ? Object.fromEntries(notif.meta) : {},
      createdAt: notif.createdAt,
      isRead: notif.isRead,
    });
  } catch (err) {
    console.error("❌ Socket emit notification error:", err.message);
  }
};

/* ==========================================================
   LOW-LEVEL: createNotification (used by all helpers)
   - You can still call this directly if you want.
========================================================== */
export const createNotification = async (req, payload) => {
  const {
    recipientId,
    userId, // alias for backwards compatibility
    companyId = null,
    type = "system",
    category = "system",
    title = "",
    message,
    priority = "normal",
    image = null,
    actionUrl = null,
    relatedTripId = null,
    meta = {},
    extraData = {}, // alias, merged inside meta
  } = payload;

  const finalRecipientId = recipientId || userId;
  if (!finalRecipientId || !message) return null;

  const notif = await Notification.create({
    recipientId: finalRecipientId,
    companyId,
    type,
    category,
    title,
    message,
    priority,
    image,
    actionUrl,
    link: actionUrl, // keep link in sync
    relatedTripId,
    meta: { ...meta, ...extraData },
  });

  emitSocketNotification(req, notif);
  return notif;
};

/* ==========================================================
   A1) notifyDriver
========================================================== */
export const notifyDriver = (req, driverId, props) => {
  if (!driverId) return null;
  return createNotification(req, {
    ...props,
    recipientId: driverId,
    category: "driver",
  });
};

/* ==========================================================
   A2) notifyCustomer
========================================================== */
export const notifyCustomer = (req, customerId, props) => {
  if (!customerId) return null;
  return createNotification(req, {
    ...props,
    recipientId: customerId,
    category: "customer",
  });
};

/* ==========================================================
   A3) notifyCompanyOwner
========================================================== */
export const notifyCompanyOwner = (req, companyId, props) => {
  if (!companyId) return null;
  return createNotification(req, {
    ...props,
    recipientId: companyId,
    companyId,
    category: "company",
  });
};

/* ==========================================================
   A4) notifyShopManagers (ONLY managers of that shop)
========================================================== */
export const notifyShopManagers = async (
  req,
  companyId,
  shopId,
  props = {}
) => {
  if (!companyId || !shopId) return [];

  const managers = await User.find({
    role: "manager",
    companyId,
    shopId,
  }).select("_id");

  if (!managers.length) return [];

  return Promise.all(
    managers.map((m) =>
      createNotification(req, {
        ...props,
        recipientId: m._id,
        companyId,
        category: "manager",
        meta: { ...(props.meta || {}), shopId },
      })
    )
  );
};

/* ==========================================================
   A5) notifyAllManagersInCompany
   - Used for company-wide catalog changes, global settings, etc.
========================================================== */
export const notifyAllManagersInCompany = async (req, companyId, props = {}) => {
  if (!companyId) return [];

  const managers = await User.find({
    role: "manager",
    companyId,
  }).select("_id");

  // If no managers, fall back to notifying the company owner
  if (!managers.length) {
    return notifyCompanyOwner(req, companyId, props);
  }

  return Promise.all(
    managers.map((m) =>
      createNotification(req, {
        ...props,
        recipientId: m._id,
        companyId,
        category: "manager",
      })
    )
  );
};

/* ==========================================================
   A6) notifyChatMessage (Shop ↔ Company only)
========================================================== */
export const notifyChatMessage = async (req, {
  senderId,
  recipientId,
  companyId,
  shopId = null,
  message,
  isFromCompany = false,
}) => {
  if (!recipientId || !message) return null;

  return createNotification(req, {
    recipientId,
    companyId,
    type: "chat",
    category: isFromCompany ? "manager" : "company",
    title: isFromCompany
      ? "New message from company"
      : "New message from shop",
    message,
    priority: "normal",
    meta: {
      senderId,
      companyId,
      shopId,
      isFromCompany,
    },
  });
};
