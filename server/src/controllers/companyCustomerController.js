// server/src/controllers/companyCustomerController.js
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import mongoose from "mongoose";

const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role)) return user.companyId;
  return null;
};

/* ==========================================================
   👥 GET CUSTOMERS FOR THIS COMPANY
   Only customers who have at least 1 trip with this company
   ========================================================== */
export const getCompanyCustomers = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    // Optionally, we can filter only delivered + in_progress + assigned + pending
    // Here, we consider any trip except cancelled as "valid" customer activity
    const matchStage = {
      companyId: new mongoose.Types.ObjectId(companyId),
      customerId: { $ne: null },
    };

    const agg = await Trip.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$customerId",
          totalTrips: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ["$totalAmount", 0] } },
          lastTripDate: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $project: {
          _id: 0,
          customerId: "$customer._id",
          name: "$customer.name",
          email: "$customer.email",
          phoneNumber: "$customer.phoneNumber",
          isActive: "$customer.isActive",
          createdAt: "$customer.createdAt",
          totalTrips: 1,
          totalSpent: 1,
          lastTripDate: 1,
        },
      },
      {
        $sort: {
          lastTripDate: -1,
        },
      },
    ]);

    res.json({
      ok: true,
      count: agg.length,
      customers: agg,
    });
  } catch (err) {
    console.error("❌ getCompanyCustomers error:", err.message);
    res.status(500).json({ error: "Server error fetching customers" });
  }
};

/* ==========================================================
   📊 CUSTOMER STATS (for this company only)
   ========================================================== */
export const getCompanyCustomerStats = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params; // customerId

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    // Make sure user exists and is customer
    const customer = await User.findOne({
      _id: id,
      role: "customer",
    }).select("name email phoneNumber isActive createdAt");

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const trips = await Trip.find({
      companyId,
      customerId: id,
    }).select("status totalAmount createdAt");

    const totalTrips = trips.length;
    let deliveredTrips = 0;
    let cancelledTrips = 0;
    let totalSpent = 0;
    let lastTripDate = null;

    for (const t of trips) {
      if (t.status === "delivered") {
        deliveredTrips += 1;
        totalSpent += t.totalAmount || 0;
      }
      if (t.status === "cancelled") {
        cancelledTrips += 1;
      }
      if (!lastTripDate || t.createdAt > lastTripDate) {
        lastTripDate = t.createdAt;
      }
    }

    res.json({
      ok: true,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
      },
      stats: {
        totalTrips,
        deliveredTrips,
        cancelledTrips,
        totalSpent,
        lastTripDate,
      },
    });
  } catch (err) {
    console.error("❌ getCompanyCustomerStats error:", err.message);
    res.status(500).json({ error: "Server error fetching customer stats" });
  }
};

/* ==========================================================
   🧾 CUSTOMER RECENT TRIPS (for this company only)
   ========================================================== */
export const getCompanyCustomerRecentTrips = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params; // customerId

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const trips = await Trip.find({
      companyId,
      customerId: id,
    })
      .populate("driverId", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentTrips = trips.map((t) => ({
      id: t._id,
      status: t.status,
      totalAmount: t.totalAmount || 0,
      createdAt: t.createdAt,
      pickupAddress: t.pickupLocation?.address || "",
      dropoffAddress: t.dropoffLocation?.address || "",
      driverName: t.driverId?.name || "Unassigned",
      paymentStatus: t.paymentStatus || "unpaid",
    }));

    res.json({
      ok: true,
      trips: recentTrips,
    });
  } catch (err) {
    console.error("❌ getCompanyCustomerRecentTrips error:", err.message);
    res.status(500).json({ error: "Server error fetching customer trips" });
  }
};
