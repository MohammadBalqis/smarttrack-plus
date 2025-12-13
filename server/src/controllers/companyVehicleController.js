import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import Trip from "../models/Trip.js";

/* ==========================================================
   Helper: resolve companyId from logged-in user
========================================================== */
const resolveCompanyIdFromUser = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver"].includes(user.role)) return user.companyId;
  return null;
};

/* ==========================================================
   🚗 GET COMPANY VEHICLES (READ ONLY)
   - ONLY vehicles created from DRIVER VERIFICATION
   - Vehicles MUST be linked to a driver
========================================================== */
export const getCompanyVehicles = async (req, res) => {
  try {
    const companyId = resolveCompanyIdFromUser(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { status, plate, driverId } = req.query;

    const query = {
      companyId,
      driverId: { $ne: null }, // 🔥 ONLY vehicles linked to drivers
    };

    if (status) query.status = status;
    if (driverId) query.driverId = driverId;
    if (plate) query.plateNumber = new RegExp(plate, "i");

    const vehicles = await Vehicle.find(query)
      .populate({
        path: "driverId",
        select:
          "name profileImage shopId driverVerification driverVerificationStatus",
        populate: {
          path: "shopId",
          select: "name city",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ok: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (err) {
    console.error("❌ getCompanyVehicles error:", err);
    res.status(500).json({ error: "Error loading vehicles" });
  }
};

/* ==========================================================
   ❌ CREATE VEHICLE — DISABLED
========================================================== */
export const createCompanyVehicle = async (req, res) => {
  return res.status(403).json({
    error:
      "Vehicles are created automatically from driver verification. Manual creation is disabled.",
  });
};

/* ==========================================================
   ❌ UPDATE VEHICLE INFO — DISABLED
========================================================== */
export const updateCompanyVehicle = async (req, res) => {
  return res.status(403).json({
    error:
      "Vehicle details are managed via driver verification. Editing is disabled.",
  });
};

/* ==========================================================
   ❌ ASSIGN DRIVER — DISABLED
========================================================== */
export const assignCompanyVehicleDriver = async (req, res) => {
  return res.status(403).json({
    error:
      "Drivers are linked to vehicles during verification. Manual assignment is disabled.",
  });
};

/* ==========================================================
   🔄 UPDATE VEHICLE STATUS
   - allowed: available / maintenance
========================================================== */
export const updateCompanyVehicleStatus = async (req, res) => {
  try {
    const companyId = resolveCompanyIdFromUser(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["available", "maintenance"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const vehicle = await Vehicle.findOne({
      _id: id,
      companyId,
      driverId: { $ne: null },
    });

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    vehicle.status = status;
    await vehicle.save();

    res.json({
      ok: true,
      message: "Vehicle status updated",
      vehicle,
    });
  } catch (err) {
    console.error("❌ updateCompanyVehicleStatus error:", err);
    res.status(500).json({ error: "Error updating vehicle status" });
  }
};

/* ==========================================================
   📜 VEHICLE TRIP HISTORY (READ ONLY)
========================================================== */
export const getCompanyVehicleTrips = async (req, res) => {
  try {
    const companyId = resolveCompanyIdFromUser(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { id } = req.params;

    const vehicle = await Vehicle.findOne({
      _id: id,
      companyId,
      driverId: { $ne: null },
    });

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    const trips = await Trip.find({ vehicleId: id })
      .sort({ createdAt: -1 })
      .populate("driverId", "name")
      .populate("customerId", "name phone")
      .lean();

    res.json({
      ok: true,
      total: trips.length,
      trips,
    });
  } catch (err) {
    console.error("❌ getCompanyVehicleTrips error:", err);
    res.status(500).json({ error: "Error loading vehicle trips" });
  }
};
