import { Router } from "express";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

const resolveCompanyIdFromUser = (user) =>
  user.role === "company" ? user._id : user.companyId;

/* ==========================================================
   🚗 CREATE VEHICLE (Company / Manager)
========================================================== */
router.post(
  "/vehicle/create",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { type, brand, model, plateNumber, notes, vehicleImage, shopId } =
        req.body;

      if (!type || !brand || !model || !plateNumber)
        return res.status(400).json({ error: "Missing required fields" });

      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const exists = await Vehicle.findOne({ plateNumber, companyId });
      if (exists)
        return res.status(400).json({ error: "Plate number already exists" });

      const finalShopId =
        req.user.role === "manager" ? req.user.shopId : shopId || null;

      const vehicle = await Vehicle.create({
        type,
        brand,
        model,
        plateNumber,
        notes: notes || "",
        vehicleImage: vehicleImage || null,
        companyId,
        shopId: finalShopId,
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
   🧾 GET ALL VEHICLES FOR COMPANY / MANAGER
========================================================== */
router.get(
  "/vehicles",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const filter = { companyId };

      // Manager only sees vehicles in his shop
      if (req.user.role === "manager" && req.user.shopId) {
        filter.shopId = req.user.shopId;
      }

      const vehicles = await Vehicle.find(filter)
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
   🔄 ASSIGN / REMOVE DRIVER — Shop-aware
========================================================== */
router.put(
  "/assign-driver/:vehicleId",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { driverId } = req.body;

      const companyId = resolveCompanyIdFromUser(req.user);

      // Shop filter
      const filter = { _id: vehicleId, companyId };
      if (req.user.role === "manager") filter.shopId = req.user.shopId;

      const vehicle = await Vehicle.findOne(filter);
      if (!vehicle)
        return res.status(404).json({ error: "Vehicle not found" });

      if (vehicle.status === "maintenance") {
        return res.status(400).json({
          error: "Vehicle is under maintenance — cannot assign driver",
        });
      }

      if (driverId) {
        const driver = await User.findOne({
          _id: driverId,
          role: "driver",
          companyId,
        });
        if (!driver)
          return res
            .status(400)
            .json({ error: "Driver not found or not part of this company" });

        vehicle.driverId = driverId;
        vehicle.status = "in_use";
      } else {
        vehicle.driverId = null;
        vehicle.status = "available";
      }

      await vehicle.save();

      res.json({
        ok: true,
        message: driverId
          ? "Driver assigned to vehicle"
          : "Driver removed from vehicle",
        vehicle,
      });
    } catch (err) {
      console.error("❌ Assign Driver Error:", err.message);
      res.status(500).json({ error: "Server error assigning driver" });
    }
  }
);

/* ==========================================================
   🧰 UPDATE STATUS — Shop-aware
========================================================== */
router.put(
  "/update-status/:vehicleId",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { status } = req.body;

      const allowed = ["available", "in_use", "maintenance"];
      if (!allowed.includes(status))
        return res.status(400).json({
          error: "Invalid status",
        });

      const companyId = resolveCompanyIdFromUser(req.user);

      const filter = { _id: vehicleId, companyId };
      if (req.user.role === "manager") filter.shopId = req.user.shopId;

      const vehicle = await Vehicle.findOne(filter);
      if (!vehicle)
        return res.status(404).json({ error: "Vehicle not found" });

      if (vehicle.driverId && status === "available") {
        return res.status(400).json({
          error: "Remove driver before setting vehicle to 'available'",
        });
      }

      vehicle.status = status;
      await vehicle.save();

      res.json({
        ok: true,
        message: `Status updated to ${status}`,
        vehicle,
      });
    } catch (err) {
      console.error("❌ Update Status Error:", err.message);
      res.status(500).json({ error: "Server error updating vehicle status" });
    }
  }
);

export default router;
