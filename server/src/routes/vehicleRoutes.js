// server/src/routes/vehicleRoutes.js
import { Router } from "express";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   🚗 CREATE VEHICLE (Company / Manager)
   ========================================================== */
router.post(
  "/create",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const { type, brand, model, plateNumber, notes, vehicleImage } = req.body;

      if (!type || !brand || !model || !plateNumber)
        return res.status(400).json({ error: "Missing fields" });

      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const vehicle = await Vehicle.create({
        type,
        brand,
        model,
        plateNumber,
        companyId,
        notes,
        vehicleImage: vehicleImage || null, // URL or null
      });

      res.status(201).json({
        ok: true,
        message: "Vehicle added successfully",
        vehicle,
      });
    } catch (err) {
      console.error("❌ Create Vehicle Error:", err.message);
      res.status(500).json({ error: "Server error creating vehicle" });
    }
  }
);

/* ==========================================================
   🧾 GET ALL VEHICLES FOR COMPANY
   ========================================================== */
router.get(
  "/get-all",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const vehicles = await Vehicle.find({ companyId }).populate(
        "driverId",
        "name email profileImage"
      );

      res.json({ ok: true, count: vehicles.length, vehicles });
    } catch (err) {
      console.error("❌ Get Vehicles Error:", err.message);
      res.status(500).json({ error: "Server error fetching vehicles" });
    }
  }
);

/* ==========================================================
   🔄 ASSIGN / REMOVE DRIVER FROM VEHICLE
   ========================================================== */
router.put(
  "/assign-driver/:vehicleId",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { driverId } = req.body;

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

      if (vehicle.status === "maintenance")
        return res.status(400).json({
          error: "Vehicle is under maintenance — cannot assign driver",
        });

      vehicle.driverId = driverId || null;

      // Update status based on assignment
      vehicle.status = driverId ? "in_use" : "available";

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
   🧰 UPDATE VEHICLE STATUS (manual)
   ========================================================== */
router.put(
  "/update-status/:vehicleId",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { status } = req.body;

      const allowedStatuses = ["available", "in_use", "maintenance"];
      if (!allowedStatuses.includes(status))
        return res.status(400).json({
          error: "Invalid status. Must be: available, in_use, or maintenance.",
        });

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle)
        return res.status(404).json({ error: "Vehicle not found" });

      // Rule: cannot set available if driver assigned
      if (vehicle.driverId && status === "available") {
        return res.status(400).json({
          error:
            "Vehicle cannot be 'available' while assigned to a driver. Remove driver first.",
        });
      }

      vehicle.status = status;
      await vehicle.save();

      res.json({
        ok: true,
        message: `Vehicle status updated to ${status}`,
        vehicle,
      });
    } catch (err) {
      console.error("❌ Update Vehicle Status Error:", err.message);
      res.status(500).json({ error: "Server error updating vehicle status" });
    }
  }
);

export default router;
