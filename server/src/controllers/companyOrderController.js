// server/src/controllers/companyOrderController.js
import Order from "../models/Order.js";
import User from "../models/User.js";
// (Optional future feature) import notifications
// import { createNotification } from "./trip/tripHelpers.js";

/* ==========================================================
   Helper: resolve companyId from user
========================================================== */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role)) return user.companyId;
  return null;
};

/* ==========================================================
   GET /api/company/orders
   📦 List all orders for this company (with filters)
========================================================== */
export const getCompanyOrders = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const {
      status,
      driverId,
      customerId,
      from,   // ISO date
      to,     // ISO date
      page = 1,
      limit = 20,
    } = req.query;

    const query = { companyId };

    if (status && status !== "all") {
      query.status = status;
    }

    if (driverId) query.driverId = driverId;
    if (customerId) query.customerId = customerId;

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("customerId", "name email phone")
        .populate("driverId", "name phone")
        .populate("vehicleId", "plateNumber model brand")
        .lean(),

      Order.countDocuments(query),
    ]);

    // Summary for dashboard cards
    const summary = orders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        acc.totalRevenue = (acc.totalRevenue || 0) + (o.total || 0);
        return acc;
      },
      { totalRevenue: 0 }
    );

    res.json({
      ok: true,
      total,
      page: pageNum,
      limit: limitNum,
      summary,
      orders,
    });
  } catch (err) {
    console.error("❌ getCompanyOrders error:", err.message);
    res.status(500).json({ error: "Server error fetching orders" });
  }
};

/* ==========================================================
   GET /api/company/orders/:id
   🔍 Single order details
========================================================== */
export const getCompanyOrderDetails = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { id } = req.params;

    const order = await Order.findOne({ _id: id, companyId })
      .populate("customerId", "name email phone")
      .populate("driverId", "name phone")
      .populate("vehicleId", "plateNumber model brand")
      .lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      ok: true,
      order,
    });
  } catch (err) {
    console.error("❌ getCompanyOrderDetails error:", err.message);
    res.status(500).json({ error: "Server error fetching order details" });
  }
};

/* ==========================================================
   PATCH /api/company/orders/:id/status
   🧑‍💼 Manual status change (EARLY PHASE ONLY)
========================================================== */
export const updateCompanyOrderStatus = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { id } = req.params;
    const { newStatus } = req.body;

    const allowedTargetStatuses = ["accepted", "preparing", "cancelled"];
    const allowedCurrentStatuses = ["pending", "accepted", "preparing"];

    if (!newStatus || !allowedTargetStatuses.includes(newStatus)) {
      return res.status(400).json({
        error:
          "Invalid status. Company can only set: accepted, preparing, cancelled.",
      });
    }

    const order = await Order.findOne({ _id: id, companyId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (!allowedCurrentStatuses.includes(order.status)) {
      return res.status(400).json({
        error: `Order is already '${order.status}' and cannot be changed manually by company.`,
      });
    }

    if (order.status === newStatus) {
      return res.json({
        ok: true,
        message: "Status unchanged (already set)",
        order,
      });
    }

    const oldStatus = order.status;
    order.status = newStatus;

    // Add to timeline
    order.timeline.push({
      status: newStatus,
      timestamp: new Date(),
    });

    await order.save();

    res.json({
      ok: true,
      message: `Order status updated from '${oldStatus}' to '${newStatus}'.`,
      order,
    });
  } catch (err) {
    console.error("❌ updateCompanyOrderStatus error:", err.message);
    res.status(500).json({ error: "Server error updating order status" });
  }
};

/* ==========================================================
   GET /api/company/orders/stats
   📊 High-level analytics
========================================================== */
export const getCompanyOrdersStats = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const orders = await Order.find({ companyId }).lean();

    const totalOrders = orders.length;
    const deliveredCount = orders.filter(
      (o) => o.status === "delivered" || o.status === "completed"
    ).length;
    const cancelledCount = orders.filter((o) => o.status === "cancelled").length;
    const pendingCount = orders.filter((o) => o.status === "pending").length;

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    const lastOrderDate =
      orders.length > 0
        ? orders
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0].createdAt
        : null;

    res.json({
      ok: true,
      stats: {
        totalOrders,
        deliveredCount,
        cancelledCount,
        pendingCount,
        totalRevenue,
        lastOrderDate,
      },
    });
  } catch (err) {
    console.error("❌ getCompanyOrdersStats error:", err.message);
    res.status(500).json({ error: "Server error fetching order stats" });
  }
};
