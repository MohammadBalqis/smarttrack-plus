// server/src/routes/managerVehicleRoutes.js
import { Router } from "express";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   🚗 GET ALL VEHICLES WITH DRIVER + STATUS
   ========================================================== */
router.get(
  "/vehicles",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const vehicles = await Vehicle.find({ companyId })
        .populate("driverId", "name email phone profileImage role")
        .sort({ createdAt: -1 });

      res.json({
        ok: true,
        count: vehicles.length,
        vehicles,
      });
    } catch (err) {
      console.error("❌ Error fetching vehicles:", err.message);
      res.status(500).json({ error: "Error fetching vehicles" });
    }
  }
);
/* ==========================================================
   ➕ CREATE VEHICLE
   ========================================================== */
router.post(
  "/vehicle/create",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { type, brand, model, plateNumber, notes, vehicleImage } = req.body;

      if (!type || !brand || !model || !plateNumber)
        return res.status(400).json({ error: "Missing required fields" });

      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const exists = await Vehicle.findOne({ plateNumber });
      if (exists)
        return res.status(400).json({ error: "Plate number already exists" });

      const vehicle = await Vehicle.create({
        type,
        brand,
        model,
        plateNumber,
        notes: notes || "",
        vehicleImage: vehicleImage || null,
        companyId,
      });

      res.status(201).json({
        ok: true,
        message: "Vehicle created successfully",
        vehicle,
      });
    } catch (err) {
      console.error("❌ Vehicle creation error:", err.message);
      res.status(500).json({ error: "Error creating vehicle" });
    }
  }
);
/* ==========================================================
   👨‍🔧 ASSIGN / REMOVE DRIVER
   ========================================================== */
router.put(
  "/vehicle/:vehicleId/assign-driver",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { driverId } = req.body;

      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId });

      if (!vehicle)
        return res.status(404).json({ error: "Vehicle not found" });

      // Removing a driver
      if (!driverId) {
        vehicle.driverId = null;
        vehicle.status = "available";
        await vehicle.save();
        return res.json({
          ok: true,
          message: "Driver removed from vehicle",
          vehicle,
        });
      }

      // Assign new driver
      const driver = await User.findOne({
        _id: driverId,
        companyId,
        role: "driver",
      });

      if (!driver)
        return res
          .status(400)
          .json({ error: "Driver not found or not part of your company" });

      vehicle.driverId = driverId;
      vehicle.status = "in_use";
      await vehicle.save();

      res.json({
        ok: true,
        message: "Driver assigned successfully",
        vehicle,
      });
    } catch (err) {
      console.error("❌ Assign driver error:", err.message);
      res.status(500).json({ error: "Error assigning driver" });
    }
  }
);
/* ==========================================================
   🔄 UPDATE VEHICLE STATUS
   ========================================================== */
router.put(
  "/vehicle/:vehicleId/status",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { status } = req.body;

      const allowed = ["available", "in_use", "maintenance"];
      if (!allowed.includes(status))
        return res.status(400).json({ error: "Invalid status" });

      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId });

      if (!vehicle)
        return res.status(404).json({ error: "Vehicle not found" });

      // business rule
      if (vehicle.driverId && status === "available")
        return res.status(400).json({
          error: "Cannot mark available while assigned to driver",
        });

      vehicle.status = status;
      await vehicle.save();

      res.json({
        ok: true,
        message: "Status updated",
        vehicle,
      });
    } catch (err) {
      console.error("❌ Update vehicle status error:", err.message);
      res.status(500).json({ error: "Error updating vehicle status" });
    }
  }
);
/* ==========================================================
   📜 VEHICLE TRIP HISTORY
   ========================================================== */
router.get(
  "/vehicle/:vehicleId/trips",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { vehicleId } = req.params;

      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId });

      if (!vehicle)
        return res.status(404).json({ error: "Vehicle not found" });

      const trips = await Trip.find({
        vehicleId,
      })
        .sort({ createdAt: -1 })
        .populate("driverId", "name")
        .populate("customerId", "name phone");

      res.json({
        ok: true,
        vehicle: {
          brand: vehicle.brand,
          model: vehicle.model,
          plateNumber: vehicle.plateNumber,
        },
        total: trips.length,
        trips,
      });
    } catch (err) {
      console.error("❌ Trip history error:", err.message);
      res.status(500).json({ error: "Error fetching vehicle trip history" });
    }
  }
);
export default router;
