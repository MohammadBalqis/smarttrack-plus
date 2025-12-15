import Trip from "../models/Trip.js";
import User from "../models/User.js";
import crypto from "crypto";

/* ==========================================================
   QR SIGNATURE
========================================================== */
const signQR = (data) => {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data) + process.env.QR_SECRET)
    .digest("hex");
};

/* ==========================================================
   🟦 1) CUSTOMER GETS QR FOR HIS TRIP
   GET /api/customer/trip/:tripId/qr
========================================================== */
export const getCustomerTripQR = async (req, res) => {
  try {
    const { tripId } = req.params;
    const customerId = req.user._id;

    const trip = await Trip.findOne({
      _id: tripId,
      customerId,
    })
      .populate("driverId", "name phone profileImage")
      .populate("companyId", "name");

    if (!trip) {
      return res.status(404).json({ ok: false, error: "Trip not found." });
    }

    if (!["assigned", "in_progress"].includes(trip.status)) {
      return res.status(400).json({
        ok: false,
        error: "Trip is not active.",
      });
    }

    const qrPayload = {
      tripId: trip._id.toString(),
      customerId: trip.customerId.toString(),
      driverId: trip.driverId?.toString(),
    };

    const signature = signQR(qrPayload);

    return res.json({
      ok: true,
      qr: {
        ...qrPayload,
        signature,
      },
      driver: trip.driverId,
      company: trip.companyId,
    });
  } catch (err) {
    console.error("❌ getCustomerTripQR error:", err);
    return res.status(500).json({ ok: false, error: "QR fetch failed." });
  }
};

/* ==========================================================
   🟩 2) CUSTOMER CONFIRMS DELIVERY (QR SCAN)
   POST /api/customer/trip/confirm-qr
========================================================== */
export const confirmDeliveryByQR = async (req, res) => {
  try {
    const customerId = req.user._id;
    if (req.user.role !== "customer") {
      return res.status(403).json({ error: "Customer only." });
    }

    const { qr } = req.body;
    if (!qr) {
      return res.status(400).json({ error: "QR data missing." });
    }

    const { tripId, customerId: qrCustomerId, driverId, signature } = qr;

    // verify signature
    const expected = signQR({ tripId, customerId: qrCustomerId, driverId });
    if (expected !== signature) {
      return res.status(400).json({ error: "Invalid QR signature." });
    }

    // verify trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found." });
    }

    if (trip.customerId.toString() !== customerId.toString()) {
      return res.status(403).json({ error: "Not your trip." });
    }

    if (!["assigned", "in_progress"].includes(trip.status)) {
      return res.status(400).json({ error: "Trip already completed." });
    }

    /* ✅ FINALIZE TRIP */
    trip.status = "delivered";
    trip.customerConfirmed = true;
    trip.confirmationTime = new Date();
    trip.liveStatus = "Delivered";

    await trip.save();

    /* 🔓 FREE DRIVER */
    await User.findByIdAndUpdate(trip.driverId, {
      driverStatus: "online",
    });

    return res.json({
      ok: true,
      message: "Delivery confirmed ✔",
      tripId: trip._id,
      confirmationTime: trip.confirmationTime,
    });
  } catch (err) {
    console.error("❌ confirmDeliveryByQR error:", err);
    return res.status(500).json({ error: "Confirmation failed." });
  }
};
