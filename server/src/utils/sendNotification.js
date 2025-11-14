import Notification from "../models/Notification.js";
import { io } from "../../server.js"; 

export const sendNotification = async ({
  userId,
  companyId,
  title,
  message,
  type = "system",
  relatedTripId = null,
}) => {
  // 1️⃣ Save in database
  const notif = await Notification.create({
    userId,
    companyId,
    title,
    message,
    type,
    relatedTripId,
  });

  // 2️⃣ Emit to socket room
  io.to(userId.toString()).emit("notification", {
    _id: notif._id,
    title,
    message,
    type,
    relatedTripId,
    createdAt: notif.createdAt,
  });

  return notif;
};
