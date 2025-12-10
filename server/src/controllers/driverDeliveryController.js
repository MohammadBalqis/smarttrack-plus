import Trip from "../../models/Trip.js";
import { io } from "../../../server.js";

/**
 * Driver scans QR → verifies → confirms delivery
 */
export const confirmDeliveryByQR = async (req, res) => {
  try {
    const driverId = req.user._id;
    const { tripId } = req.body;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ ok: false, error: "Trip not found." });
    }

    if (String(trip.driverId) !== String(driverId)) {
      return res.status(401).json({
        ok: false,
        error: "You are not assigned to this trip.",
      });
    }

    if (trip.customerConfirmed) {
      return res.json({ ok: true, message: "Customer already confirmed." });
    }

    trip.customerConfirmed = true;
    trip.confirmationTime = new Date();
    trip.status = "delivered";

    await trip.save();

    // notify company + manager + customer
    io.to(`company_${trip.companyId}`).emit("trip:delivered", { tripId });
    io.to(`manager_${trip.managerId}`).emit("trip:delivered", { tripId });
    io.to(`customer_${trip.customerId}`).emit("trip:delivered", { tripId });

    return res.json({
      ok: true,
      message: "Delivery confirmed!",
      trip,
    });
  } catch (err) {
    console.error("QR confirmation failed:", err);
    return res.status(500).json({ ok: false, error: "Server error." });
  }
};
