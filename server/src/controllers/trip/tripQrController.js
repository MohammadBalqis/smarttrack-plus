// server/src/controllers/trip/tripQrController.js
import Trip from "../../models/Trip.js";
import Vehicle from "../../models/Vehicle.js";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import { getPopulatedTripForNotify, createNotification, broadcastTripStatus } from "./tripHelpers.js";
import { logActivity } from "../../utils/activityLogger.js";

/* ==========================================================
   🟢 7. Generate Secure QR Code for Customer Delivery Confirm
   ========================================================== */
export const generateTripQr = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip)
      return res.status(404).json({ error: "Trip not found" });

    const qrToken = jwt.sign(
      {
        tripId,
        customerId: trip.customerId,
        driverId: trip.driverId,
      },
      process.env.QR_SECRET,
      { expiresIn: "10m" }
    );

    const confirmUrl = `${process.env.FRONTEND_URL}/confirm-delivery?token=${qrToken}`;

    const qrImage = await QRCode.toDataURL(confirmUrl);

    res.json({
      ok: true,
      confirmUrl,
      qrImage,
      expiresIn: "10m",
    });
  } catch (err) {
    console.error("❌ QR generation error:", err.message);
    res.status(500).json({
      error: "Server error generating QR",
    });
  }
};

/* ==========================================================
   🟣 8. Confirm Delivery (Customer scan) — Critical Event
   ========================================================== */
export const confirmDelivery = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token)
      return res.status(400).json({ error: "Missing QR token" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.QR_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired QR" });
    }

    const { tripId } = decoded;
    const trip = await Trip.findById(tripId);

    if (!trip)
      return res.status(404).json({ error: "Trip not found" });

    if (trip.status !== "delivered")
      return res.status(400).json({
        error: "Trip must be marked delivered by driver first.",
      });

    trip.customerConfirmed = true;
    trip.confirmationTime = new Date();
    await trip.save();

    await Vehicle.findByIdAndUpdate(trip.vehicleId, {
      status: "available",
    });

    // 🔔 Notify company/manager that customer confirmed
    const populatedTrip = await getPopulatedTripForNotify(trip._id);
    const payloadCommon = {
      trip: populatedTrip,
      driver: populatedTrip.driverId,
      vehicle: populatedTrip.vehicleId,
      customer: populatedTrip.customerId,
    };

    if (populatedTrip.companyId?._id) {
      await createNotification(req, {
        userId: populatedTrip.companyId._id,
        title: "Customer Confirmed Delivery",
        message: "The customer has confirmed the delivery via QR scan.",
        type: "status",
        category: "company",
        relatedTripId: populatedTrip._id,
        actionUrl: `/company/trips/${populatedTrip._id}`,
        extraData: payloadCommon,
      });
    }

    // 🔁 Realtime broadcast
    await broadcastTripStatus(req, trip._id);

    // 🧾 Activity log — critical event
    await logActivity({
      userId: null, // customer is anonymous here (no auth)
      action: "TRIP_CONFIRM_DELIVERY",
      description: `Customer confirmed delivery for trip ${trip._id} via QR scan`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
      meta: {
        tripId: trip._id,
        companyId: trip.companyId,
        driverId: trip.driverId,
        customerId: trip.customerId,
      },
    });

    res.json({
      ok: true,
      message: "Customer confirmed delivery successfully!",
      trip,
    });
  } catch (err) {
    console.error("❌ Delivery confirm error:", err.message);
    res.status(500).json({
      error: "Server error confirming delivery",
    });
  }
};
