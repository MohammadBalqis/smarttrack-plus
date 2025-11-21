// server/src/controllers/companyTripsController.js
import Trip from "../models/Trip.js";
import User from "../models/User.js";

const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role)) return user.companyId;
  return null;
};

/* ==========================================================
   📌 GET PAGINATED TRIPS (with filters)
   ========================================================== */
export const getCompanyTrips = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) return res.status(400).json({ error: "Company not found" });

    const { page = 1, limit = 20, status, driverId, from, to } = req.query;

    const query = { companyId };

    if (status) query.status = status;
    if (driverId) query.driverId = driverId;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const total = await Trip.countDocuments(query);

    const trips = await Trip.find(query)
      .populate("driverId", "name")
      .populate("customerId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      ok: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      trips,
    });
  } catch (err) {
    console.error("❌ getCompanyTrips error:", err);
    res.status(500).json({ error: "Failed to fetch trips" });
  }
};

/* ==========================================================
   📌 GET SINGLE TRIP DETAILS
   ========================================================== */
export const getCompanyTripDetails = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;

    const trip = await Trip.findOne({
      _id: id,
      companyId,
    })
      .populate("driverId", "name phoneNumber")
      .populate("customerId", "name phoneNumber")
      .populate("orderItems.productId", "name price");

    if (!trip) return res.status(404).json({ error: "Trip not found" });

    res.json({ ok: true, trip });
  } catch (err) {
    console.error("❌ getCompanyTripDetails error:", err);
    res.status(500).json({ error: "Failed to load trip" });
  }
};

/* ==========================================================
   🧭 ASSIGN / REASSIGN DRIVER TO TRIP
   (Manager / Company can call this)
   ========================================================== */
export const assignTripDriver = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;
    const { driverId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "Company not found" });
    }

    if (!driverId) {
      return res.status(400).json({ error: "driverId is required" });
    }

    // Check trip exists and belongs to this company
    const trip = await Trip.findOne({ _id: id, companyId });
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Optional: prevent changing driver after delivery
    if (trip.status === "delivered" || trip.status === "cancelled") {
      return res
        .status(400)
        .json({ error: "Cannot change driver for delivered/cancelled trips" });
    }

    // Check driver belongs to same company and is active
    const driver = await User.findOne({
      _id: driverId,
      role: "driver",
      companyId,
      isActive: true,
    });

    if (!driver) {
      return res
        .status(400)
        .json({ error: "Driver not found or not active in this company" });
    }

    trip.driverId = driver._id;

    // If trip was pending, move it to assigned
    if (trip.status === "pending") {
      trip.status = "assigned";
    }

    await trip.save();

    const updatedTrip = await Trip.findById(trip._id)
      .populate("driverId", "name")
      .populate("customerId", "name");

    res.json({
      ok: true,
      message: "Driver assigned successfully",
      trip: updatedTrip,
    });
  } catch (err) {
    console.error("❌ assignTripDriver error:", err);
    res.status(500).json({ error: "Failed to assign driver" });
  }
};
