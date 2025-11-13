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
   🏢 CREATE COMPANY — OWNER ONLY
   ========================================================== */
router.post("/create", protect, authorizeRoles("owner"), async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !email)
      return res
        .status(400)
        .json({ error: "Company name and email are required" });

    const existing = await Company.findOne({ email });
    if (existing)
      return res
        .status(409)
        .json({ error: "Company already exists" });

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

    console.log(`✅ Company created by owner: ${req.user.email}`);
  } catch (err) {
    console.error("❌ Error creating company:", err.message);
    res.status(500).json({ error: "Server error creating company" });
  }
});
/* ==========================================================
   📊 COMPANY DASHBOARD SUMMARY
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

      /* ---------------------------
         1) TOTAL COUNTS
      ----------------------------*/
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

      /* ---------------------------
         2) TRIP COUNTS
      ----------------------------*/
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

      /* ---------------------------
         3) TOP 5 DRIVERS
      ----------------------------*/
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
          drivers: {
            total: totalDrivers,
            available: availableDrivers,
          },
          vehicles: {
            total: totalVehicles,
            available: availableVehicles,
          },
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
