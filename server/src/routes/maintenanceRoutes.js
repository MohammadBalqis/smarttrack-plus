// server/src/routes/maintenanceRoutes.js
import { Router } from "express";
import Maintenance from "../models/Maintenance.js";
import Vehicle from "../models/Vehicle.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   🧰 CREATE MAINTENANCE RECORD
   ========================================================== */
router.post(
  "/create",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const { vehicleId, description, cost, mechanicName, startDate, notes } = req.body;

      if (!vehicleId || !description || !cost)
        return res.status(400).json({ error: "Missing required fields" });

      // 🔎 Check if vehicle exists
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

      // 🚫 Vehicle already under maintenance
      if (vehicle.status === "maintenance") {
        return res.status(400).json({ error: "Vehicle already in maintenance" });
      }

      // 🧰 Create new maintenance record
      const record = await Maintenance.create({
        vehicleId,
        companyId: req.user.role === "company" ? req.user._id : req.user.companyId,
        description,
        cost,
        mechanicName,
        startDate,
        notes,
        status: "in_progress",
      });

      // 🚗 Update vehicle status
      vehicle.status = "maintenance";
      await vehicle.save();

      res.status(201).json({
        ok: true,
        message: "Maintenance record created successfully",
        record,
      });
    } catch (err) {
      console.error("❌ Error creating maintenance record:", err.message);
      res.status(500).json({ error: "Server error creating maintenance record" });
    }
  }
);

/* ==========================================================
   🔁 UPDATE / COMPLETE MAINTENANCE RECORD
   ========================================================== */
router.put(
  "/update/:id",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, endDate, notes } = req.body;

      const record = await Maintenance.findById(id);
      if (!record) return res.status(404).json({ error: "Record not found" });

      // Update status
      if (status) record.status = status;
      if (endDate) record.endDate = endDate;
      if (notes) record.notes = notes;

      await record.save();

      // 🟢 If completed → set vehicle back to available
      if (status === "completed" && record.vehicleId) {
        const vehicle = await Vehicle.findById(record.vehicleId);
        if (vehicle) {
          vehicle.status = "available";
          await vehicle.save();
        }
      }

      res.json({
        ok: true,
        message: "Maintenance record updated successfully",
        record,
      });
    } catch (err) {
      console.error("❌ Error updating maintenance record:", err.message);
      res.status(500).json({ error: "Server error updating maintenance record" });
    }
  }
);

/* ==========================================================
   📋 GET ALL MAINTENANCE RECORDS (PER COMPANY)
   ========================================================== */
router.get(
  "/all",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const records = await Maintenance.find({ companyId })
        .populate("vehicleId", "plateNumber model status")
        .sort({ createdAt: -1 });

      res.json({
        ok: true,
        count: records.length,
        records,
      });
    } catch (err) {
      console.error("❌ Error fetching maintenance records:", err.message);
      res.status(500).json({ error: "Server error fetching maintenance records" });
    }
  }
);
/* ==========================================================
   📊 DASHBOARD SUMMARY — Maintenance Stats
   ========================================================== */
router.get(
  "/summary",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      // 1️⃣ Aggregate stats
      const stats = await Maintenance.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        {
          $group: {
            _id: "$status",
            totalCost: { $sum: "$cost" },
            count: { $sum: 1 },
          },
        },
      ]);

      // 2️⃣ Transform data for readability
      const summary = {
        pending: 0,
        in_progress: 0,
        completed: 0,
        totalCost: 0,
      };

      stats.forEach((s) => {
        summary[s._id] = s.count;
        summary.totalCost += s.totalCost;
      });

      // 3️⃣ Get number of active maintenance vehicles
      const activeVehicles = await Maintenance.countDocuments({
        companyId,
        status: "in_progress",
      });

      res.json({
        ok: true,
        summary,
        activeVehicles,
      });
    } catch (err) {
      console.error("❌ Error generating maintenance summary:", err.message);
      res.status(500).json({ error: "Server error fetching maintenance summary" });
    }
  }
);

export default router;
