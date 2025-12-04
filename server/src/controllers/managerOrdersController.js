// server/src/controllers/managerOrdersController.js
import Order from "../models/Order.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import Payment from "../models/Payment.js";

/* ==========================================================
   Helper: resolve companyId from logged-in user
   - company  → user._id
   - manager  → user.companyId
========================================================== */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (user.role === "manager") return user.companyId;
  return null;
};

/* ==========================================================
   1) GET ALL ORDERS FOR MANAGER/COMPANY
========================================================== */
export const getManagerOrders = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res
        .status(400)
        .json({ ok: false, error: "Unable to resolve companyId" });
    }

    const isManager = req.user.role === "manager";
    const shopId = isManager ? req.user.shopId : null;

    let {
      status,
      startDate,
      endDate,
      minTotal,
      maxTotal,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 20;

    const filter = { companyId };
    if (shopId) filter.shopId = shopId;

    // 🟡 Status filter (supports comma-separated list)
    if (status) {
      const statuses = status.split(",").map((s) => s.trim());
      filter.status = { $in: statuses };
    }

    // 🗓 Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // 💵 Total amount range filter
    if (minTotal || maxTotal) {
      filter.total = {};
      if (minTotal) filter.total.$gte = Number(minTotal);
      if (maxTotal) filter.total.$lte = Number(maxTotal);
    }

    // Base query
    const baseQuery = Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("customerId", "name email phone")
      .populate("driverId", "name phone")
      .populate("vehicleId", "plateNumber brand model");

    let allOrders = await baseQuery.lean();

    // 🔍 In-memory search on populated fields
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();

      allOrders = allOrders.filter((o) => {
        const customerName = o.customerId?.name?.toLowerCase() || "";
        const customerPhone = o.customerId?.phone?.toLowerCase() || "";
        const driverName = o.driverId?.name?.toLowerCase() || "";
        const plate = o.vehicleId?.plateNumber?.toLowerCase() || "";
        const pick = o.pickupLocation?.address?.toLowerCase() || "";
        const drop = o.dropoffLocation?.address?.toLowerCase() || "";

        return (
          customerName.includes(q) ||
          customerPhone.includes(q) ||
          driverName.includes(q) ||
          plate.includes(q) ||
          pick.includes(q) ||
          drop.includes(q)
        );
      });
    }

    const totalCount = allOrders.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const startIndex = (page - 1) * limit;
    const paginated = allOrders.slice(startIndex, startIndex + limit);

    res.json({
      ok: true,
      page,
      limit,
      total: totalCount,
      totalPages,
      orders: paginated,
    });
  } catch (err) {
    console.error("❌ getManagerOrders error:", err.message);
    res.status(500).json({
      ok: false,
      error: "Server error fetching orders",
    });
  }
};

/* ==========================================================
   2) GET SINGLE ORDER DETAILS
========================================================== */
export const getManagerOrderDetails = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res
        .status(400)
        .json({ ok: false, error: "Unable to resolve companyId" });
    }

    const isManager = req.user.role === "manager";
    const shopId = isManager ? req.user.shopId : null;

    const { orderId } = req.params;

    const match = { _id: orderId, companyId };
    if (shopId) match.shopId = shopId;

    const order = await Order.findOne(match)
      .populate("customerId", "name email phone profileImage createdAt")
      .populate("driverId", "name email phone profileImage")
      .populate("vehicleId", "plateNumber brand model type status vehicleImage")
      .populate("tripId");

    if (!order) {
      return res
        .status(404)
        .json({ ok: false, error: "Order not found for your scope" });
    }

    let payment = null;
    if (order.tripId) {
      const payMatch = {
        tripId: order.tripId._id,
        companyId,
      };
      if (shopId) payMatch.shopId = shopId;

      payment = await Payment.findOne(payMatch)
        .sort({ createdAt: -1 })
        .lean();
    }

    res.json({
      ok: true,
      order,
      payment,
    });
  } catch (err) {
    console.error("❌ getManagerOrderDetails error:", err.message);
    res.status(500).json({
      ok: false,
      error: "Server error fetching order details",
    });
  }
};

/* ==========================================================
   3) GET ORDER TIMELINE
========================================================== */
export const getManagerOrderTimeline = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res
        .status(400)
        .json({ ok: false, error: "Unable to resolve companyId" });
    }

    const isManager = req.user.role === "manager";
    const shopId = isManager ? req.user.shopId : null;

    const { orderId } = req.params;

    const match = { _id: orderId, companyId };
    if (shopId) match.shopId = shopId;

    const order = await Order.findOne(match).select(
      "timeline status createdAt updatedAt"
    );

    if (!order) {
      return res
        .status(404)
        .json({ ok: false, error: "Order not found for your scope" });
    }

    const sortedTimeline = [...(order.timeline || [])].sort(
      (a, b) =>
        new Date(a.timestamp || a.createdAt) -
        new Date(b.timestamp || b.createdAt)
    );

    res.json({
      ok: true,
      orderId: order._id,
      currentStatus: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      timeline: sortedTimeline,
    });
  } catch (err) {
    console.error("❌ getManagerOrderTimeline error:", err.message);
    res.status(500).json({
      ok: false,
      error: "Server error fetching order timeline",
    });
  }
};

/* ==========================================================
   4) ORDERS SUMMARY
========================================================== */
export const getManagerOrdersSummary = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res
        .status(400)
        .json({ ok: false, error: "Unable to resolve companyId" });
    }

    const isManager = req.user.role === "manager";
    const shopId = isManager ? req.user.shopId : null;

    const match = { companyId };
    if (shopId) match.shopId = shopId;

    const agg = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
        },
      },
    ]);

    let totalOrders = 0;
    let delivered = 0;
    let cancelled = 0;
    let totalRevenue = 0;

    agg.forEach((row) => {
      totalOrders += row.count;
      totalRevenue += row.totalRevenue || 0;
      if (row._id === "delivered" || row._id === "completed") {
        delivered += row.count;
      }
      if (row._id === "cancelled") {
        cancelled += row.count;
      }
    });

    res.json({
      ok: true,
      summary: {
        totalOrders,
        delivered,
        cancelled,
        totalRevenue,
      },
    });
  } catch (err) {
    console.error("❌ getManagerOrdersSummary error:", err.message);
    res.status(500).json({
      ok: false,
      error: "Server error fetching orders summary",
    });
  }
};
