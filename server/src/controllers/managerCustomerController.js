// server/src/controllers/managerCustomerController.js
import Trip from "../models/Trip.js";
import User from "../models/User.js";

/* Helper: resolve companyId for company / manager */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (user.role === "manager") return user.companyId;
  return null;
};

/* ==========================================================
   📋 MANAGER — LIST CUSTOMERS (FOR THIS COMPANY ONLY)
   - Based on Trip collection
   - Filters: search, minTrips, page, limit
========================================================== */
export const getManagerCustomers = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const {
      page = 1,
      limit = 20,
      search = "",
      minTrips = 0,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const baseMatch = {
      companyId,
      customerId: { $ne: null },
    };

    // Aggregation pipeline on Trip
    const pipeline = [
      { $match: baseMatch },
      {
        $group: {
          _id: "$customerId",
          totalTrips: { $sum: 1 },
          deliveredTrips: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, 1, 0],
            },
          },
          cancelledTrips: {
            $sum: {
              $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
            },
          },
          // estimate customer "spent" = totalAmount + deliveryFee (if totalAmount not filled yet)
          totalAmount: {
            $sum: {
              $add: [
                { $ifNull: ["$totalAmount", 0] },
                { $ifNull: ["$deliveryFee", 0] },
              ],
            },
          },
          lastTripAt: { $max: "$createdAt" },
          firstTripAt: { $min: "$createdAt" },
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
      // Filter by name / email / phone after lookup
    ];

    const filters = [];

    if (search && search.trim().length > 0) {
      const regex = new RegExp(search.trim(), "i");
      filters.push({
        $or: [
          { "customer.name": regex },
          { "customer.email": regex },
          { "customer.phone": regex },
          { "customer.phoneNumber": regex },
        ],
      });
    }

    if (minTrips && Number(minTrips) > 0) {
      filters.push({
        totalTrips: { $gte: Number(minTrips) },
      });
    }

    if (filters.length > 0) {
      pipeline.push({ $match: { $and: filters } });
    }

    // Facet for pagination + total count
    pipeline.push({
      $facet: {
        data: [
          { $sort: { lastTripAt: -1 } },
          { $skip: skip },
          { $limit: limitNum },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    const result = await Trip.aggregate(pipeline);
    const agg = result[0] || { data: [], totalCount: [] };
    const customers = agg.data;
    const total = agg.totalCount[0]?.count || 0;

    // Map to clean response shape
    const mapped = customers.map((c) => ({
      customerId: c.customer._id,
      name: c.customer.name,
      email: c.customer.email,
      phone: c.customer.phone || c.customer.phoneNumber || "",
      avatar: c.customer.profileImage || null,
      isActive: c.customer.isActive !== false,
      totalTrips: c.totalTrips,
      deliveredTrips: c.deliveredTrips,
      cancelledTrips: c.cancelledTrips,
      totalAmount: c.totalAmount || 0,
      lastTripAt: c.lastTripAt,
      firstTripAt: c.firstTripAt,
      createdAt: c.customer.createdAt,
    }));

    res.json({
      ok: true,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      customers: mapped,
    });
  } catch (err) {
    console.error("❌ getManagerCustomers error:", err.message);
    res.status(500).json({
      error: "Server error fetching customers",
    });
  }
};

/* ==========================================================
   📌 MANAGER — SINGLE CUSTOMER DETAILS
   - Basic profile
   - Aggregated stats (trips)
   - Recent trips list
========================================================== */
export const getManagerCustomerDetails = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { customerId } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }
    if (!customerId) {
      return res.status(400).json({ error: "Missing customerId" });
    }

    const customer = await User.findOne({
      _id: customerId,
      role: "customer",
    }).select("name email phone phoneNumber profileImage isActive createdAt");

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Stats for this customer with THIS company
    const statsAgg = await Trip.aggregate([
      {
        $match: {
          companyId,
          customerId: customer._id,
        },
      },
      {
        $group: {
          _id: "$customerId",
          totalTrips: { $sum: 1 },
          deliveredTrips: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, 1, 0],
            },
          },
          cancelledTrips: {
            $sum: {
              $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
            },
          },
          totalAmount: {
            $sum: {
              $add: [
                { $ifNull: ["$totalAmount", 0] },
                { $ifNull: ["$deliveryFee", 0] },
              ],
            },
          },
          lastTripAt: { $max: "$createdAt" },
          firstTripAt: { $min: "$createdAt" },
        },
      },
    ]);

    const statsRaw = statsAgg[0] || null;

    const stats = statsRaw
      ? {
          totalTrips: statsRaw.totalTrips,
          deliveredTrips: statsRaw.deliveredTrips,
          cancelledTrips: statsRaw.cancelledTrips,
          totalAmount: statsRaw.totalAmount || 0,
          lastTripAt: statsRaw.lastTripAt,
          firstTripAt: statsRaw.firstTripAt,
        }
      : {
          totalTrips: 0,
          deliveredTrips: 0,
          cancelledTrips: 0,
          totalAmount: 0,
          lastTripAt: null,
          firstTripAt: null,
        };

    // Recent trips
    const recentTrips = await Trip.find({
      companyId,
      customerId: customer._id,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("driverId", "name profileImage")
      .populate("vehicleId", "brand model plateNumber")
      .select(
        "status pickupLocation dropoffLocation deliveryFee totalAmount createdAt"
      );

    res.json({
      ok: true,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || customer.phoneNumber || "",
        avatar: customer.profileImage || null,
        isActive: customer.isActive !== false,
        createdAt: customer.createdAt,
      },
      stats,
      recentTrips,
    });
  } catch (err) {
    console.error("❌ getManagerCustomerDetails error:", err.message);
    res.status(500).json({
      error: "Server error fetching customer details",
    });
  }
};
