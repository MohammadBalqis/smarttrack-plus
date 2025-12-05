import { sendNotification } from "../services/notificationService.js";

export const notify = (req, payload) => {
  const io = req.app.get("io");
  return sendNotification({ ...payload, io });
};
