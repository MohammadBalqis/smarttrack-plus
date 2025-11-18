// server/src/controllers/trip/tripHelpers.js
import Trip from "../../models/Trip.js";
import Notification from "../../models/Notification.js";

export const TRIP_STATUS_EVENT = "trip-status";

/* ==========================================================
   🔔 Socket Helper — Safe Emit
   ========================================================== */
export const emitToUser = (req, userId, event, payload) => {
  try {
    const io = req.app.get("io");
    if (io && userId) {
      io.to(String(userId)).emit(event, payload);
    }
  } catch (err) {
    console.error("⚠ Socket emit error:", err.message);
  }
};

/* ==========================================================
   🧩 Populate Trip For Notifications
   ========================================================== */
export const getPopulatedTripForNotify = async (tripId) => {
  return Trip.findById(tripId)
    .populate("driverId", "name email phone profileImage")
    .populate("vehicleId", "type brand model plateNumber status vehicleImage")
    .populate("customerId", "name email phone")
    .populate("companyId", "name email companyName");
};

/* ==========================================================
   🔔 Create Notification + Emit
   ========================================================== */
export const createNotification = async (
  req,
  {
    userId,
    title,
    message,
    type = "system",
    category = "system",
    relatedTripId,
    image = null,
    actionUrl = null,
    priority = "normal",
    sound = null,
    extra = {},
    extraData,
  }
) => {
  if (!userId) return;

  const finalExtraData = extraData ?? extra ?? {};

  const noti = await Notification.create({
    userId,
    title,
    message,
    type,
    category,
    image,
    actionUrl,
    priority,
    sound,
    relatedTripId: relatedTripId || null,
    extraData: finalExtraData,
  });

  emitToUser(req, userId, "notify", {
    _id: noti._id,
    userId,
    title,
    message,
    type,
    category,
    image,
    actionUrl,
    priority,
    sound,
    relatedTripId: relatedTripId || null,
    createdAt: noti.createdAt,
    extraData: finalExtraData,
  });
};

/* ==========================================================
   📡 Broadcast Trip Status To All Related Users
   ========================================================== */
export const broadcastTripStatus = async (req, tripId) => {
  try {
    const io = req.app.get("io");
    if (!io) return;

    const trip = await getPopulatedTripForNotify(tripId);
    if (!trip) return;

    const payload = {
      tripId: trip._id,
      status: trip.status,
      liveStatus: trip.liveStatus || null,
      pickupLocation: trip.pickupLocation,
      dropoffLocation: trip.dropoffLocation,
      routeHistory: trip.routeHistory,
      startTime: trip.startTime,
      endTime: trip.endTime,
      deliveryFee: trip.deliveryFee,
      paymentStatus: trip.paymentStatus,
      customerConfirmed: trip.customerConfirmed,
      totalDistance: trip.totalDistance,
      driver: trip.driverId,
      vehicle: trip.vehicleId,
      customer: trip.customerId,
      company: trip.companyId,
      updatedAt: new Date(),
    };

    const targets = [
      trip.driverId?._id,
      trip.customerId?._id,
      trip.companyId?._id,
    ].filter(Boolean);

    targets.forEach((userId) => {
      io.to(String(userId)).emit(TRIP_STATUS_EVENT, payload);
    });
  } catch (err) {
    console.error("⚠ trip-status broadcast error:", err.message);
  }
};
