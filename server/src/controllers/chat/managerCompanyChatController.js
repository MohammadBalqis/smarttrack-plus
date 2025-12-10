import ManagerCompanyChat from "../../models/ManagerCompanyChat.js";
import { resolveCompanyId } from "../../utils/resolveCompanyId.js";
import { io } from "../../../server.js";

export const sendManagerCompanyMessage = async (req, res) => {
  try {
    const user = req.user;
    const { message, managerId: bodyManagerId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    const companyId = resolveCompanyId(user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve company." });
    }

    let managerId;
    let senderType;

    if (user.role === "manager") {
      managerId = user._id;
      senderType = "manager";
    } else if (user.role === "company") {
      managerId = bodyManagerId;
      senderType = "company";
    } else {
      return res.status(403).json({ error: "Not allowed." });
    }

    const doc = await ManagerCompanyChat.create({
      companyId,
      managerId,
      senderType,
      message: message.trim(),
    });

    io.to(`company_${companyId}`).emit("chat:mc:new", doc);
    io.to(`manager_${managerId}`).emit("chat:mc:new", doc);

    res.json({ ok: true, data: doc });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message." });
  }
};

export const getManagerCompanyChatHistory = async (req, res) => {
  try {
    const user = req.user;
    const companyId = resolveCompanyId(user);
    const { managerId } = req.params;

    const messages = await ManagerCompanyChat.find({
      companyId,
      managerId,
    }).sort({ createdAt: 1 });

    res.json({ ok: true, data: messages });
  } catch (err) {
    res.status(500).json({ error: "Failed to load chat." });
  }
};
