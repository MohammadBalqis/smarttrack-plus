import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import { resolveCompanyId } from "../utils/resolveCompanyId.js";

/* ==========================================================
   🚗 1) LIST VEHICLES FOR THIS MANAGER'S SHOP
========================================================== */
export const getManagerVehicles = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const shopId = req.user.shopId;

    if (!companyId || !shopId) {
      return res.status(400).json({
        ok: false,
        error: "Unable to resolve company/shop for this manager.",
      });
    }

    const vehicles = await Vehicle.find({ companyId, shopId })
      .populate("assignedDriver", "name phone driverStatus currentLat currentLng")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      total: vehicles.length,
      vehicles,
    });
  } catch (err) {
    console.error("❌ getManagerVehicles error:", err);
    res.status(500).json({ ok: false, error: "Server error loading vehicles" });
  }
};

/* ==========================================================
   🚗 2) ASSIGN DRIVER TO VEHICLE (Manager)
========================================================== */
export const assignDriverToVehicle = async (req, res) => {
  try {
    const managerShopId = req.user.shopId;
    const { vehicleId } = req.params;
    const { driverId } = req.body;

    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      shopId: managerShopId, // manager can only modify his shop
    });

    if (!vehicle) {
      return res.status(404).json({ ok: false, error: "Vehicle not found" });
    }

    const driver = await User.findOne({
      _id: driverId,
      role: "driver",
      shopId: managerShopId,
    });

    if (!driver) {
      return res.status(400).json({ ok: false, error: "Driver not found in this shop" });
    }

    vehicle.assignedDriver = driverId;
    await vehicle.save();

    res.json({
      ok: true,
      message: "Driver assigned successfully",
      vehicle,
    });
  } catch (err) {
    console.error("❌ assignDriverToVehicle error:", err);
    res.status(500).json({ ok: false, error: "Error assigning driver" });
  }
};

/* ==========================================================
   🚗 3) TOGGLE VEHICLE ACTIVE STATE (Manager)
========================================================== */
export const toggleVehicleActive = async (req, res) => {
  try {
    const managerShopId = req.user.shopId;
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      shopId: managerShopId,
    });

    if (!vehicle) {
      return res.status(404).json({ ok: false, error: "Vehicle not found" });
    }

    vehicle.isActive = !vehicle.isActive;
    await vehicle.save();

    res.json({
      ok: true,
      message: `Vehicle ${vehicle.isActive ? "activated" : "deactivated"}`,
      vehicle,
    });
  } catch (err) {
    console.error("❌ toggleVehicleActive error:", err);
    res.status(500).json({ ok: false, error: "Failed to toggle vehicle state" });
  }
};
