import ManagerCompanyChat from "../../models/ManagerCompanyChat.js";
import User from "../../models/User.js";
import { resolveCompanyId } from "../../utils/resolveCompanyId.js";
import { io } from "../../../server.js";

/* ==========================================================
   SEND MESSAGE (COMPANY ↔ MANAGER)
========================================================== */
export const sendManagerCompanyMessage = async (req, res) => {
  try {
    const user = req.user;
    const { message, managerId: bodyManagerId } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    const companyId = resolveCompanyId(user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve company." });
    }

    let managerId;
    let senderType;

    /* ---------------- ROLE LOGIC ---------------- */
    if (user.role === "manager") {
      managerId = user._id;
      senderType = "manager";
    }

    if (user.role === "company") {
      if (!bodyManagerId) {
        return res.status(400).json({ error: "managerId is required." });
      }

      const manager = await User.findOne({
        _id: bodyManagerId,
        role: "manager",
        companyId,
        isActive: true,
      });

      if (!manager) {
        return res.status(404).json({ error: "Manager not found." });
      }

      managerId = manager._id;
      senderType = "company";
    }

    if (!managerId || !senderType) {
      return res.status(403).json({ error: "Not allowed." });
    }

    /* ---------------- CREATE MESSAGE ---------------- */
    const doc = await ManagerCompanyChat.create({
      companyId,
      managerId,
      senderType,
      message: message.trim(),
    });

    /* ---------------- SOCKET EVENTS ---------------- */
    io.to(`company_${companyId}`).emit("chat:mc:new", doc);
    io.to(`manager_${managerId}`).emit("chat:mc:new", doc);

    return res.json({ ok: true, data: doc });
  } catch (err) {
    console.error("sendManagerCompanyMessage error:", err);
    return res.status(500).json({ error: "Failed to send message." });
  }
};

/* ==========================================================
   GET CHAT HISTORY
========================================================== */
export const getManagerCompanyChatHistory = async (req, res) => {
  try {
    const user = req.user;
    const companyId = resolveCompanyId(user);
    const { managerId } = req.params;

    if (!companyId || !managerId) {
      return res.status(400).json({ error: "Invalid request." });
    }

    const messages = await ManagerCompanyChat.find({
      companyId,
      managerId,
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ ok: true, data: messages });
  } catch (err) {
    console.error("getManagerCompanyChatHistory error:", err);
    return res.status(500).json({ error: "Failed to load chat." });
  }
};
