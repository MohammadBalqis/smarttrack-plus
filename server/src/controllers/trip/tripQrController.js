import Trip from "../../models/Trip.js";
import { logActivity } from "../../utils/activityLogger.js";

/* Helper: generate secure 8-char code (A-Z, 0-9) */
const generateConfirmationCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0 or I/1 to avoid confusion
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

/* ==========================================================
   1) CUSTOMER — GET TRIP QR + DRIVER INFO
   GET /api/customer/trips/:tripId/qr
========================================================== */
export const getCustomerTripQrInfo = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findOne({
      _id: tripId,
      customerId: req.user._id,
    })
      .populate("driverId", "name phone profileImage")
      .populate("companyId", "name");

    if (!trip) {
      return res.status(404).json({ error: "Trip not found." });
    }

    // Only generate code if not already generated
    if (!trip.confirmationCode) {
      trip.confirmationCode = generateConfirmationCode();
      await trip.save();
    }

    // Payload that will be encoded inside QR
    const qrPayload = {
      type: "DELIVERY_CONFIRMATION",
      code: trip.confirmationCode,
      tripId: String(trip._id),
      companyId: String(trip.companyId?._id || trip.companyId),
    };

    return res.json({
      ok: true,
      data: {
        trip: {
          id: trip._id,
          status: trip.status,
          totalAmount: trip.totalAmount,
          deliveryFee: trip.deliveryFee,
          customerConfirmed: trip.customerConfirmed,
          confirmationTime: trip.confirmationTime,
        },
        driver: trip.driverId
          ? {
              id: trip.driverId._id,
              name: trip.driverId.name,
              phone: trip.driverId.phone,
              profileImage: trip.driverId.profileImage,
            }
          : null,
        company: {
          id: trip.companyId?._id || trip.companyId,
          name: trip.companyId?.name,
        },
        qrPayload,              // to be turned into QR on frontend
        confirmationCode: trip.confirmationCode, // also show as text
      },
    });
  } catch (err) {
    console.error("getCustomerTripQrInfo error:", err);
    return res.status(500).json({ error: "Failed to load QR info." });
  }
};

/* ==========================================================
   2) DRIVER — CONFIRM DELIVERY BY CODE / QR
   POST /api/driver/trips/confirm-delivery
   body: { code }
========================================================== */
export const driverConfirmDeliveryByCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: "Confirmation code is required." });
    }

    // Driver can only confirm THEIR own trips
    const trip = await Trip.findOne({
      confirmationCode: code.trim().toUpperCase(),
      driverId: req.user._id,
    });

    if (!trip) {
      return res.status(404).json({
        error: "No trip found for this code, or it is not assigned to you.",
      });
    }

    if (trip.customerConfirmed) {
      return res.status(400).json({
        error: "This delivery was already confirmed.",
      });
    }

    trip.customerConfirmed = true;
    trip.confirmationTime = new Date();
    trip.status = "delivered";
    trip.paymentStatus = trip.paymentStatus === "unpaid" ? "pending" : trip.paymentStatus;

    await trip.save();

    // Optional: log activity for company dashboard / audits
    await logActivity({
      userId: req.user._id,
      action: "TRIP_DELIVERY_CONFIRMED",
      description: `Driver confirmed delivery for trip ${trip._id}`,
      meta: {
        tripId: trip._id,
        companyId: trip.companyId,
      },
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    return res.json({
      ok: true,
      message: "Delivery confirmed successfully.",
      data: {
        id: trip._id,
        status: trip.status,
        customerConfirmed: trip.customerConfirmed,
        confirmationTime: trip.confirmationTime,
      },
    });
  } catch (err) {
    console.error("driverConfirmDeliveryByCode error:", err);
    return res.status(500).json({ error: "Failed to confirm delivery." });
  }
};
