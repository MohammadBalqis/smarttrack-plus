// server/src/controllers/driverController.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import GlobalSettings from "../models/GlobalSettings.js";
import Trip from "../models/Trip.js";
import Payment from "../models/Payment.js";
import Vehicle from "../models/Vehicle.js";
import { logActivity } from "../utils/activityLogger.js";

/* ==========================================================
   🛡 MAINTENANCE MODE CHECK
========================================================== */
const ensureNotInMaintenance = async (req, res) => {
  const settings = await GlobalSettings.findOne();
  if (settings?.maintenanceMode && req.user.role !== "superadmin") {
    res.status(503).json({
      ok: false,
      error: "System is under maintenance.",
    });
    return false;
  }
  return true;
};

/* ==========================================================
   🟢 1. CREATE DRIVER (Company / Manager / Superadmin)
========================================================== */
export const createDriver = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    const { name, email, password, companyId: bodyCompanyId } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({
        ok: false,
        error: "name, email, and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({
        ok: false,
        error: "Email already in use",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const profileImage = req.file
      ? `/uploads/drivers/${req.file.filename}`
      : null;

    // Determine companyId
    let finalCompanyId = null;

    if (req.user.role === "company") {
      finalCompanyId = req.user._id;
    } else if (req.user.role === "manager") {
      finalCompanyId = req.user.companyId;
    } else if (req.user.role === "superadmin") {
      if (!bodyCompanyId) {
        return res.status(400).json({
          ok: false,
          error:
            "companyId is required when creating drivers as superadmin.",
        });
      }
      finalCompanyId = bodyCompanyId;
    } else {
      return res.status(403).json({
        ok: false,
        error: "You are not allowed to create drivers.",
      });
    }

    const driver = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "driver",
      companyId: finalCompanyId,
      profileImage,
      driverStatus: "offline",
      isActive: true,
    });

    await logActivity({
      userId: req.user._id,
      action: "DRIVER_CREATED",
      description: `Driver "${driver.name}" created`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
      meta: {
        driverId: driver._id,
        companyId: finalCompanyId,
      },
    });

    res.status(201).json({
      ok: true,
      message: "Driver created successfully",
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        role: driver.role,
        companyId: driver.companyId,
        profileImage: driver.profileImage,
      },
    });
  } catch (err) {
    console.error("❌ createDriver error:", err);

    await logActivity({
      userId: req.user?._id,
      action: "DRIVER_CREATE_FAILED",
      description: err.message,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    res.status(500).json({
      ok: false,
      error: "Server error creating driver",
    });
  }
};

/* ==========================================================
   📋 2. GET ALL DRIVERS (Company / Manager / Superadmin)
========================================================== */
export const getAllDrivers = async (req, res) => {
  try {
    const filter = { role: "driver" };

    if (req.user.role === "company") {
      filter.companyId = req.user._id;
    } else if (req.user.role === "manager") {
      filter.companyId = req.user.companyId;
      filter.managerId = req.user._id;
    } else if (req.user.role === "superadmin") {
      if (req.query.companyId) {
        filter.companyId = req.query.companyId;
      }
    }

    const drivers = await User.find(filter).select(
      "name email companyId managerId profileImage isActive driverStatus createdAt"
    );

    res.json({
      ok: true,
      count: drivers.length,
      drivers,
    });
  } catch (err) {
    console.error("❌ getAllDrivers error:", err.message);
    res.status(500).json({ error: "Server error fetching drivers" });
  }
};

/* ==========================================================
   🚚 3. DRIVER DASHBOARD STATS (for DriverDashboard.jsx)
   GET /api/driver/dashboard
========================================================== */
export const getDriverDashboardStats = async (req, res) => {
  try {
    const driverId = req.user._id;

    const totalTrips = await Trip.countDocuments({ driverId });
    const completedTrips = await Trip.countDocuments({
      driverId,
      status: "delivered",
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEarningsAgg = await Payment.aggregate([
      {
        $match: {
          driverId,
          createdAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const todayEarnings =
      todayEarningsAgg.length > 0 ? todayEarningsAgg[0].total : 0;

    // For now, totalOnlineHours is placeholder (0)
    const stats = {
      totalTrips,
      completedTrips,
      totalOnlineHours: 0,
      todayEarnings,
    };

    return res.json({ ok: true, stats });
  } catch (err) {
    console.error("❌ getDriverDashboardStats error:", err);
    res.status(500).json({ error: "Failed to load driver dashboard." });
  }
};

/* ==========================================================
   🧾 4. DRIVER RECENT TRIPS
   GET /api/driver/recent-trips
========================================================== */
export const getDriverRecentTrips = async (req, res) => {
  try {
    const driverId = req.user._id;

    const trips = await Trip.find({ driverId })
      .populate("customerId", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({ ok: true, trips });
  } catch (err) {
    console.error("❌ getDriverRecentTrips error:", err);
    res.status(500).json({ error: "Failed to load recent trips." });
  }
};

/* ==========================================================
   📦 5. ALL DRIVER TRIPS (for DriverTrips.jsx)
   GET /api/driver/trips
========================================================== */
export const getDriverTrips = async (req, res) => {
  try {
    const driverId = req.user._id;

    const trips = await Trip.find({ driverId })
      .populate("customerId", "name")
      .sort({ createdAt: -1 });

    return res.json({ ok: true, trips });
  } catch (err) {
    console.error("❌ getDriverTrips error:", err);
    res.status(500).json({ error: "Failed to load driver trips." });
  }
};

/* ==========================================================
   🚘 6. DRIVER VEHICLE (for DriverVehicle.jsx)
   GET /api/driver/vehicle
========================================================== */
export const getDriverVehicle = async (req, res) => {
  try {
    const driverId = req.user._id;

    const vehicle = await Vehicle.findOne({
      $or: [{ driverId }, { assignedDriverId: driverId }],
    });

    return res.json({ ok: true, vehicle });
  } catch (err) {
    console.error("❌ getDriverVehicle error:", err);
    res.status(500).json({ error: "Failed to load vehicle." });
  }
};

/* ==========================================================
   💳 7. DRIVER PAYMENTS (for DriverPayments.jsx)
   GET /api/driver/payments
========================================================== */
export const getDriverPayments = async (req, res) => {
  try {
    const driverId = req.user._id;

    const payments = await Payment.find({ driverId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ ok: true, payments });
  } catch (err) {
    console.error("❌ getDriverPayments error:", err);
    res.status(500).json({ error: "Failed to load payments." });
  }
};

/* ==========================================================
   👤 8. DRIVER PROFILE (for DriverProfile.jsx)
   GET /api/driver/profile
========================================================== */
export const getDriverProfile = async (req, res) => {
  try {
    const driver = await User.findById(req.user._id).select(
      "name phone address profileImage"
    );

    if (!driver) {
      return res.status(404).json({ error: "Driver not found." });
    }

    return res.json({ ok: true, profile: driver });
  } catch (err) {
    console.error("❌ getDriverProfile error:", err);
    res.status(500).json({ error: "Failed to load profile." });
  }
};

/* ==========================================================
   ✏️ 9. UPDATE DRIVER PROFILE
   PUT /api/driver/profile
========================================================== */
export const updateDriverProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(address && { address }),
      },
      { new: true, runValidators: true }
    ).select("name phone address profileImage");

    if (!updated) {
      return res.status(404).json({ error: "Driver not found." });
    }

    return res.json({ ok: true, profile: updated });
  } catch (err) {
    console.error("❌ updateDriverProfile error:", err);
    res.status(500).json({ error: "Failed to update profile." });
  }
};

/* ==========================================================
   ✅ 10. CONFIRM DELIVERY FROM QR (Option C)
   POST /api/driver/confirm-delivery-from-qr
========================================================== */
export const confirmDeliveryFromQr = async (req, res) => {
  try {
    const driverId = req.user._id;

    if (req.user.role !== "driver") {
      return res.status(403).json({ error: "Only drivers can confirm QR." });
    }

    const { qrPayload } = req.body;
    if (!qrPayload) {
      return res.status(400).json({ error: "qrPayload is required." });
    }

    let data;
    try {
      data = JSON.parse(qrPayload);
    } catch (err) {
      return res.status(400).json({ error: "Invalid QR payload format." });
    }

    const tripId = data.tripId;
    if (!tripId) {
      return res.status(400).json({ error: "tripId missing in QR payload." });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found." });
    }

    // Ensure this trip belongs to this driver
    if (!trip.driverId || String(trip.driverId) !== String(driverId)) {
      return res
        .status(403)
        .json({ error: "This trip is not assigned to you." });
    }

    // Basic status checks
    if (trip.status === "delivered" && trip.customerConfirmed) {
      return res.json({
        ok: true,
        message: "Trip already confirmed as delivered.",
        trip,
      });
    }

    // Update trip as delivered + confirmed
    trip.status = "delivered";
    trip.customerConfirmed = true;
    trip.confirmationTime = new Date();
    trip.liveStatus = "Delivered & confirmed via QR";

    await trip.save();

    // (Optional) you can log activity here if you want
    await logActivity({
      userId: driverId,
      action: "TRIP_CONFIRMED_QR",
      description: `Trip ${trip._id} confirmed by driver via QR`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
      meta: {
        tripId: trip._id,
        companyId: trip.companyId,
        customerId: trip.customerId,
      },
    });

    return res.json({
      ok: true,
      message: "Delivery confirmed successfully.",
      trip,
    });
  } catch (err) {
    console.error("❌ confirmDeliveryFromQr error:", err);
    res.status(500).json({ error: "Failed to confirm QR delivery." });
  }
};
