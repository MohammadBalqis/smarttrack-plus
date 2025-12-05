import { Router } from "express";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   🚗 GET ALL VEHICLES (SHOP FILTER FOR MANAGERS)
========================================================== */
router.get(
  "/vehicles",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      // Managers must only see their shop
      const shopFilter =
        req.user.role === "manager" ? { shopId: req.user.shopId } : {};

      const vehicles = await Vehicle.find({
        companyId,
        ...shopFilter,
      })
        .populate("driverId", "name phone email driverStatus currentLat currentLng")
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
   ➕ CREATE VEHICLE (Manager's shop automatically assigned)
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

      const shopId =
        req.user.role === "manager" ? req.user.shopId : req.body.shopId || null;

      const exists = await Vehicle.findOne({ plateNumber, companyId });
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
        shopId,
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
   👨‍🔧 ASSIGN / REMOVE DRIVER (Same Shop Only)
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

      const shopFilter =
        req.user.role === "manager" ? { shopId: req.user.shopId } : {};

      const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        companyId,
        ...shopFilter,
      });

      if (!vehicle)
        return res.status(404).json({ error: "Vehicle not found" });

      // Removing driver
      if (!driverId) {
        vehicle.driverId = null;
        vehicle.status = "available";
        await vehicle.save();
        return res.json({
          ok: true,
          message: "Driver removed",
          vehicle,
        });
      }

      // Assign driver (must be from same shop)
      const driver = await User.findOne({
        _id: driverId,
        role: "driver",
        companyId,
        ...shopFilter,
      });

      if (!driver)
        return res.status(400).json({
          error: "Driver not found in your shop",
        });

      vehicle.driverId = driverId;
      vehicle.status = "in_use";
      await vehicle.save();

      res.json({
        ok: true,
        message: "Driver assigned",
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

      const shopFilter =
        req.user.role === "manager" ? { shopId: req.user.shopId } : {};

      const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        companyId,
        ...shopFilter,
      });

      if (!vehicle)
        return res.status(404).json({ error: "Vehicle not found" });

      if (vehicle.driverId && status === "available")
        return res.status(400).json({
          error: "Cannot set available while driver assigned",
        });

      vehicle.status = status;
      await vehicle.save();

      res.json({
        ok: true,
        message: "Status updated",
        vehicle,
      });
    } catch (err) {
      console.error("❌ Update status error:", err.message);
      res.status(500).json({ error: "Error updating vehicle status" });
    }
  }
);

/* ==========================================================
   📜 VEHICLE TRIP HISTORY (Same shop only)
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

      const shopFilter =
        req.user.role === "manager" ? { shopId: req.user.shopId } : {};

      const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        companyId,
        ...shopFilter,
      });

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
      res.status(500).json({ error: "Error fetching trip history" });
    }
  }
);

export default router;
