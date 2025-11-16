// server/src/routes/companyRoutes.js
import { Router } from "express";
import Company from "../models/Company.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";

const router = Router();

/* ==========================================================
   🟣 SUPERADMIN — LIST ALL COMPANIES
   ========================================================== */
router.get(
  "/superadmin/list",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const companies = await Company.find()
        .populate("ownerId", "name email role")
        .sort({ createdAt: -1 });

      res.json({ ok: true, total: companies.length, companies });
    } catch (err) {
      console.error("❌ Superadmin list companies error:", err.message);
      res.status(500).json({ error: "Server error loading companies" });
    }
  }
);

/* ==========================================================
   🟣 SUPERADMIN — CREATE COMPANY (full power)
   ========================================================== */
router.post(
  "/superadmin/create",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const { name, email, phone, address, ownerId } = req.body;

      if (!name || !email)
        return res
          .status(400)
          .json({ error: "Company name and email are required" });

      const existing = await Company.findOne({ email });
      if (existing)
        return res.status(409).json({ error: "Company already exists" });

      const company = await Company.create({
        name,
        email,
        phone,
        address,
        ownerId: ownerId || null,
      });

      res.status(201).json({
        ok: true,
        message: "Company created by superadmin",
        company,
      });
    } catch (err) {
      console.error("❌ Superadmin create company error:", err.message);
      res.status(500).json({ error: "Server error creating company" });
    }
  }
);

/* ==========================================================
   🟣 SUPERADMIN — UPDATE COMPANY
========================================================== */
router.patch(
  "/superadmin/update/:id",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const company = await Company.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!company)
        return res.status(404).json({ error: "Company not found" });

      res.json({ ok: true, message: "Company updated", company });
    } catch (err) {
      console.error("❌ Update company error:", err.message);
      res.status(500).json({ error: "Server error updating company" });
    }
  }
);

/* ==========================================================
   🟣 SUPERADMIN — SUSPEND / ACTIVATE COMPANY
========================================================== */
router.patch(
  "/superadmin/status/:id",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const { isActive } = req.body;

      const company = await Company.findByIdAndUpdate(
        req.params.id,
        { isActive },
        { new: true }
      );

      if (!company)
        return res.status(404).json({ error: "Company not found" });

      res.json({
        ok: true,
        message: `Company ${isActive ? "activated" : "suspended"}`,
        company,
      });
    } catch (err) {
      console.error("❌ Status update error:", err.message);
      res.status(500).json({
        error: "Server error updating company status",
      });
    }
  }
);

/* ==========================================================
   🟣 SUPERADMIN — RESET COMPANY PASSWORD
========================================================== */
router.patch(
  "/superadmin/reset-password/:ownerId",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword)
        return res
          .status(400)
          .json({ error: "newPassword is required" });

      const owner = await User.findById(req.params.ownerId);
      if (!owner || owner.role !== "company")
        return res.status(404).json({ error: "Company owner not found" });

      owner.passwordHash = await bcrypt.hash(newPassword, 10);
      await owner.save();

      res.json({
        ok: true,
        message: "Company owner password reset successfully",
      });
    } catch (err) {
      console.error("❌ Reset password error:", err.message);
      res.status(500).json({ error: "Server error resetting password" });
    }
  }
);

/* ==========================================================
   🟣 SUPERADMIN — VIEW COMPANY DETAILS
========================================================== */
router.get(
  "/superadmin/details/:companyId",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const companyId = req.params.companyId;

      const company = await Company.findById(companyId)
        .populate("ownerId", "name email role");

      if (!company)
        return res.status(404).json({ error: "Company not found" });

      const totalDrivers = await User.countDocuments({
        companyId,
        role: "driver",
      });

      const totalManagers = await User.countDocuments({
        companyId,
        role: "manager",
      });

      const totalTrips = await Trip.countDocuments({ companyId });
      const totalVehicles = await Vehicle.countDocuments({ companyId });

      res.json({
        ok: true,
        company,
        stats: {
          totalDrivers,
          totalManagers,
          totalVehicles,
          totalTrips,
        },
      });
    } catch (err) {
      console.error("❌ View company details error:", err.message);
      res.status(500).json({ error: "Server error loading company details" });
    }
  }
);

/* ==========================================================
   🟦 OWNER — CREATE COMPANY (your original feature)
   ========================================================== */
router.post(
  "/create",
  protect,
  authorizeRoles("owner"),
  async (req, res) => {
    try {
      const { name, email, phone, address } = req.body;

      if (!name || !email)
        return res
          .status(400)
          .json({ error: "Company name and email are required" });

      const existing = await Company.findOne({ email });
      if (existing)
        return res.status(409).json({ error: "Company already exists" });

      const company = await Company.create({
        name,
        email,
        phone,
        address,
        ownerId: req.user._id,
      });

      res.status(201).json({
        ok: true,
        message: "Company created successfully",
        company,
      });
    } catch (err) {
      console.error("❌ Error creating company:", err.message);
      res.status(500).json({ error: "Server error creating company" });
    }
  }
);

/* ==========================================================
   📊 COMPANY DASHBOARD SUMMARY (your original untouched code)
   ========================================================== */
router.get(
  "/dashboard",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const totalDrivers = await User.countDocuments({
        companyId,
        role: "driver",
      });

      const availableDrivers = await User.countDocuments({
        companyId,
        role: "driver",
        isActive: true,
      });

      const totalVehicles = await Vehicle.countDocuments({ companyId });
      const availableVehicles = await Vehicle.countDocuments({
        companyId,
        status: "available",
      });

      const [
        todayOrders,
        monthOrders,
        pendingOrders,
        assignedOrders,
        inProgressOrders,
        deliveredOrders,
      ] = await Promise.all([
        Trip.countDocuments({
          companyId,
          createdAt: { $gte: today },
        }),
        Trip.countDocuments({
          companyId,
          createdAt: { $gte: monthStart },
        }),
        Trip.countDocuments({ companyId, status: "pending" }),
        Trip.countDocuments({ companyId, status: "assigned" }),
        Trip.countDocuments({ companyId, status: "in_progress" }),
        Trip.countDocuments({ companyId, status: "delivered" }),
      ]);

      const topDrivers = await Trip.aggregate([
        { $match: { companyId, status: "delivered" } },
        {
          $group: {
            _id: "$driverId",
            totalTrips: { $sum: 1 },
            totalRevenue: { $sum: "$deliveryFee" },
          },
        },
        { $sort: { totalTrips: -1 } },
        { $limit: 5 },
      ]);

      res.json({
        ok: true,
        summary: {
          drivers: { total: totalDrivers, available: availableDrivers },
          vehicles: { total: totalVehicles, available: availableVehicles },
          orders: {
            today: todayOrders,
            month: monthOrders,
            pending: pendingOrders,
            assigned: assignedOrders,
            in_progress: inProgressOrders,
            delivered: deliveredOrders,
          },
          topDrivers,
        },
      });
    } catch (err) {
      console.error("❌ Dashboard error:", err.message);
      res.status(500).json({ error: "Server error loading company dashboard" });
    }
  }
);

export default router;
