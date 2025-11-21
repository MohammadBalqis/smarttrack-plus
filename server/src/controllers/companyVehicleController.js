// server/src/controllers/companyVehicleController.js
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import Trip from "../models/Trip.js";

/* Resolve companyId depending on role */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role))
    return user.companyId;
  return null;
};

/* ==========================================================
   🚘 GET ALL VEHICLES FOR COMPANY (Manager + Company)
   Supports:
   - type
   - status
   - driverId
   - plateNumber search
========================================================== */
export const getCompanyVehicles = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { type, status, driverId, plate } = req.query;

    let filters = { companyId };

    if (type) filters.type = type;
    if (status) filters.status = status;
    if (driverId) filters.driverId = driverId;
    if (plate) {
      filters.plateNumber = { $regex: plate, $options: "i" };
    }

    const vehicles = await Vehicle.find(filters)
      .populate("driverId", "name email phoneNumber")
      .populate("lastTripId")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (err) {
    console.error("❌ Error fetching vehicles:", err.message);
    res.status(500).json({ error: "Server error fetching vehicles" });
  }
};
