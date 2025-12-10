import Trip from "../models/Trip.js";
import User from "../models/User.js";
import crypto from "crypto";

/* Generate hash signature for QR */
const signQR = (data) => {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data) + process.env.QR_SECRET)
    .digest("hex");
};

/* ==========================================================
   🟦 1. GET QR DATA FOR CUSTOMER TRIP
   GET /api/customer/trip/:tripId/qr
========================================================== */
export const getCustomerTripQR = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user._id;

    // must belong to this customer
    const trip = await Trip.findOne({ _id: tripId, customerId: userId })
      .populate("driverId", "name phone profileImage")
      .populate("companyId", "name");

    if (!trip) return res.status(404).json({ error: "Trip not found." });

    const qrPayload = {
      tripId: trip._id,
      customerId: trip.customerId,
      driverId: trip.driverId?._id,
      companyId: trip.companyId?._id,
      amount: trip.totalAmount + trip.deliveryFee,
    };

    const signature = signQR(qrPayload);

    return res.json({
      ok: true,
      qr: { ...qrPayload, signature },
      driver: trip.driverId,
      company: trip.companyId,
    });
  } catch (err) {
    console.error("QR generation error:", err);
    return res.status(500).json({ error: "QR fetch failed." });
  }
};

/* ==========================================================
   🟩 2. DRIVER CONFIRMS DELIVERY BY SCANNING QR
   POST /api/driver/confirm-qr
========================================================== */
export const confirmDeliveryByQR = async (req, res) => {
  try {
    const driver = req.user;
    if (driver.role !== "driver")
      return res.status(403).json({ error: "Driver only." });

    const { qr } = req.body;
    if (!qr) return res.status(400).json({ error: "QR data missing." });

    const { tripId, customerId, driverId, amount, signature } = qr;

    // verify signature
    const expected = signQR({ tripId, customerId, driverId, amount });
    if (expected !== signature)
      return res.status(400).json({ error: "Invalid QR signature." });

    // verify trip
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found." });

    if (trip.driverId.toString() !== driver._id.toString())
      return res.status(403).json({ error: "Not your delivery." });

    if (trip.status !== "in_progress")
      return res.status(400).json({ error: "Trip not deliverable." });

    // confirm
    trip.status = "delivered";
    trip.customerConfirmed = true;
    trip.confirmationTime = new Date();
    await trip.save();

    return res.json({
      ok: true,
      message: "Delivery confirmed ✔",
      tripId: trip._id,
    });
  } catch (err) {
    console.error("QR confirm error:", err);
    return res.status(500).json({ error: "Confirmation failed." });
  }
};
