// server/src/controllers/companyCustomerController.js
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";

/* Helper: resolve companyId from user (same logic as drivers) */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role)) return user.companyId;
  return null;
};

/* ==========================================================
   👥 GET ALL CUSTOMERS FOR THIS COMPANY (with stats summary)
   GET /api/company/customers
========================================================== */
export const getCompanyCustomers = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { status, search } = req.query;

    // 1️⃣ Aggregate orders by customer to get summary
    const agg = await Order.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      {
        $group: {
          _id: "$customerId",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$total" },
          lastOrderAt: { $max: "$createdAt" },
        },
      },
    ]);

    const customerIdMap = new Map();
    const customerIds = [];

    agg.forEach((item) => {
      if (!item._id) return;
      const idStr = String(item._id);
      customerIdMap.set(idStr, {
        totalOrders: item.totalOrders,
        totalSpent: item.totalSpent || 0,
        lastOrderAt: item.lastOrderAt || null,
      });
      customerIds.push(item._id);
    });

    if (customerIds.length === 0) {
      return res.json({
        ok: true,
        count: 0,
        customers: [],
      });
    }

    // 2️⃣ Fetch user documents
    const userQuery = {
      _id: { $in: customerIds },
      role: "customer",
    };

    if (status === "active") userQuery.isActive = true;
    if (status === "inactive") userQuery.isActive = false;

    if (search && search.trim()) {
      const s = search.trim();
      userQuery.$or = [
        { name: new RegExp(s, "i") },
        { email: new RegExp(s, "i") },
      ];
    }

    const users = await User.find(userQuery)
      .select("name email phoneNumber profileImage isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // 3️⃣ Merge stats into user objects
    const customers = users.map((u) => {
      const stats = customerIdMap.get(String(u._id)) || {
        totalOrders: 0,
        totalSpent: 0,
        lastOrderAt: null,
      };
      return {
        ...u,
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
        lastOrderAt: stats.lastOrderAt,
      };
    });

    res.json({
      ok: true,
      count: customers.length,
      customers,
    });
  } catch (err) {
    console.error("❌ getCompanyCustomers error:", err.message);
    res.status(500).json({ error: "Server error fetching company customers" });
  }
};

/* ==========================================================
   📊 CUSTOMER STATS (for one customer)
   GET /api/company/customers/:id/stats
========================================================== */
export const getCompanyCustomerStats = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id: customerId } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const customer = await User.findOne({
      _id: customerId,
      role: "customer",
    }).select("name email phoneNumber profileImage isActive createdAt");

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const orders = await Order.find({
      companyId,
      customerId,
    }).sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const deliveredCount = orders.filter((o) => o.status === "delivered").length;
    const cancelledCount = orders.filter((o) => o.status === "cancelled").length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const lastOrderDate = totalOrders ? orders[0].createdAt : null;

    res.json({
      ok: true,
      customer,
      stats: {
        totalOrders,
        deliveredCount,
        cancelledCount,
        totalSpent,
        lastOrderDate,
      },
    });
  } catch (err) {
    console.error("❌ getCompanyCustomerStats error:", err.message);
    res.status(500).json({ error: "Server error fetching customer stats" });
  }
};

/* ==========================================================
   📦 CUSTOMER ORDERS LIST (for this company)
   GET /api/company/customers/:id/orders
========================================================== */
export const getCompanyCustomerOrders = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id: customerId } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const orders = await Order.find({
      companyId,
      customerId,
    })
      .sort({ createdAt: -1 })
      .populate("driverId", "name phoneNumber")
      .populate("vehicleId", "plateNumber brand model");

    res.json({
      ok: true,
      total: orders.length,
      orders,
    });
  } catch (err) {
    console.error("❌ getCompanyCustomerOrders error:", err.message);
    res.status(500).json({ error: "Server error fetching customer orders" });
  }
};

/* ==========================================================
   🚫 TOGGLE CUSTOMER ACTIVE (block / unblock)
   PATCH /api/company/customers/:id/toggle-active
========================================================== */
export const toggleCompanyCustomerStatus = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const customer = await User.findOne({
      _id: id,
      role: "customer",
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    const safeCustomer = customer.toObject();
    delete safeCustomer.passwordHash;

    res.json({
      ok: true,
      message: `Customer is now ${customer.isActive ? "active" : "inactive"}`,
      customer: safeCustomer,
    });
  } catch (err) {
    console.error("❌ toggleCompanyCustomerStatus error:", err.message);
    res.status(500).json({ error: "Server error updating customer status" });
  }
};
