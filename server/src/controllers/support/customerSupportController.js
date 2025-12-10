// server/src/controllers/support/customerSupportController.js
import SupportMessage from "../../models/SupportMessage.js";
import { resolveCompanyId } from "../../utils/resolveCompanyId.js";
import { io } from "../../../server.js";

/* ==========================================================
   POST /api/customer/support
   Customer sends ONE-WAY support message to a company
========================================================== */
export const sendSupportMessage = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "customer") {
      return res.status(403).json({ error: "Only customers can send support." });
    }

    let { companyId, message, tripId, orderId } = req.body;

    // If companyId not provided, try from active company on user
    if (!companyId) {
      companyId = resolveCompanyId(user);
    }

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "companyId is required or could not be resolved." });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    const doc = await SupportMessage.create({
      companyId,
      customerId: user._id,
      message: message.trim(),
      tripId: tripId || undefined,
      orderId: orderId || undefined,
    });

    // 🔔 Notify company room in real-time (for company dashboard)
    io.to(`company_${companyId}`).emit("support:new", {
      _id: doc._id,
      message: doc.message,
      customerId: user._id,
      createdAt: doc.createdAt,
      status: doc.status,
    });

    return res.json({
      ok: true,
      message: "Support message sent successfully.",
      data: doc,
    });
  } catch (err) {
    console.error("sendSupportMessage error:", err);
    return res.status(500).json({ error: "Failed to send support message." });
  }
};

/* ==========================================================
   GET /api/company/support/messages
   Company (or manager) reads all support messages
========================================================== */
export const getCompanySupportMessages = async (req, res) => {
  try {
    const user = req.user;
    const companyId = resolveCompanyId(user);

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "Unable to resolve company for this user." });
    }

    const messages = await SupportMessage.find({ companyId })
      .populate("customerId", "fullName phone email")
      .sort({ createdAt: -1 });

    return res.json({ ok: true, data: messages });
  } catch (err) {
    console.error("getCompanySupportMessages error:", err);
    return res.status(500).json({ error: "Failed to load support messages." });
  }
};

/* ==========================================================
   PATCH /api/company/support/:id/status
   Update status: open → reviewed / resolved
========================================================== */
export const updateSupportStatus = async (req, res) => {
  try {
    const user = req.user;
    const companyId = resolveCompanyId(user);

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "Unable to resolve company for this user." });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!["open", "reviewed", "resolved"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const doc = await SupportMessage.findOneAndUpdate(
      { _id: id, companyId },
      { status },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ error: "Support message not found." });
    }

    return res.json({ ok: true, data: doc });
  } catch (err) {
    console.error("updateSupportStatus error:", err);
    return res.status(500).json({ error: "Failed to update status." });
  }
};
