// server/src/controllers/managerOrdersController.js
import crypto from "crypto";
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
   Helper: resolve shop scope (manager only)
========================================================== */
const resolveShopScope = (user) => {
  const isManager = user?.role === "manager";
  return isManager ? user.shopId || null : null;
};

/* ==========================================================
   Helper: timeline push (safe) - for ORDER only
========================================================== */
const pushTimeline = (doc, action, meta = {}) => {
  if (!doc) return;
  if (!Array.isArray(doc.timeline)) doc.timeline = [];
  doc.timeline.push({
    action,
    meta,
    timestamp: new Date(),
  });
};

/* ==========================================================
   Helper: driver availability
========================================================== */
const isDriverAvailable = (driver) => {
  if (!driver) return false;
  if (driver.role !== "driver") return false;
  if (driver.isActive === false) return false;

  // Accept "offline" / "online" / "waiting" as available.
  // Block "on_trip" (and anything you treat as busy).
  const busy = ["on_trip", "busy", "delivering", "in_progress"];
  const status = driver.driverStatus || "offline";
  return !busy.includes(status);
};

/* ==========================================================
   Helper: generate confirmation code (Trip.confirmationCode)
========================================================== */
const generateConfirmationCode = (len = 6) => {
  const digits = "0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += digits[Math.floor(Math.random() * 10)];
  return out;
};

/* ==========================================================
   Helper: Socket emit (safe)
   IMPORTANT: This will work if your sockets join rooms by userId
   (recommended: socket.join(userId) + socket.join(`user:${userId}`)).
========================================================== */
const emitToUser = (req, userId, event, payload) => {
  try {
    const io = req.app?.get("io");
    if (!io || !userId) return;

    const id = String(userId);

    // Try multiple common room styles (harmless if room doesn't exist)
    io.to(id).emit(event, payload);
    io.to(`user:${id}`).emit(event, payload);
  } catch (e) {
    // no crash
  }
};

/* ==========================================================
   Helper: build google maps link
========================================================== */
const buildMapsLink = (lat, lng, address) => {
  if (typeof lat === "number" && typeof lng === "number") {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`;
  }
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

    const shopId = resolveShopScope(req.user);

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

    // Status filter (comma-separated)
    if (status) {
      const statuses = status.split(",").map((s) => s.trim());
      filter.status = { $in: statuses };
    }

    // Date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Total range
    if (minTotal || maxTotal) {
      filter.total = {};
      if (minTotal) filter.total.$gte = Number(minTotal);
      if (maxTotal) filter.total.$lte = Number(maxTotal);
    }

    const baseQuery = Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("customerId", "name email phone profileImage")
      .populate("driverId", "name phone profileImage driverStatus isActive")
      .populate("vehicleId", "plateNumber brand model type status vehicleImage");

    let allOrders = await baseQuery.lean();

    // In-memory search on populated fields
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();

      allOrders = allOrders.filter((o) => {
        const customerName = o.customerId?.name?.toLowerCase() || "";
        const customerPhone = String(o.customerId?.phone || "").toLowerCase();
        const customerEmail = o.customerId?.email?.toLowerCase() || "";

        const driverName = o.driverId?.name?.toLowerCase() || "";
        const plate = o.vehicleId?.plateNumber?.toLowerCase() || "";

        const pick = o.pickupLocation?.address?.toLowerCase() || "";
        const drop = o.dropoffLocation?.address?.toLowerCase() || "";

        const idStr = String(o._id || "").toLowerCase();

        return (
          idStr.includes(q) ||
          customerName.includes(q) ||
          customerPhone.includes(q) ||
          customerEmail.includes(q) ||
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

    const shopId = resolveShopScope(req.user);
    const { orderId } = req.params;

    const match = { _id: orderId, companyId };
    if (shopId) match.shopId = shopId;

    const order = await Order.findOne(match)
      .populate("customerId", "name email phone profileImage createdAt")
      .populate(
        "driverId",
        "name email phone profileImage driverStatus isActive"
      )
      .populate("vehicleId", "plateNumber brand model type status vehicleImage")
      .populate("tripId");

    if (!order) {
      return res
        .status(404)
        .json({ ok: false, error: "Order not found for your scope" });
    }

    let payment = null;
    if (order.tripId) {
      const payMatch = { tripId: order.tripId._id, companyId };
      if (shopId) payMatch.shopId = shopId;

      payment = await Payment.findOne(payMatch).sort({ createdAt: -1 }).lean();
    }

    res.json({ ok: true, order, payment });
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

    const shopId = resolveShopScope(req.user);
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
   4) ORDERS SUMMARY ✅ FIXED KEYS FOR FRONTEND
========================================================== */
export const getManagerOrdersSummary = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res
        .status(400)
        .json({ ok: false, error: "Unable to resolve companyId" });
    }

    const shopId = resolveShopScope(req.user);

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
    let deliveredCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    let totalRevenue = 0;

    agg.forEach((row) => {
      totalOrders += row.count || 0;
      totalRevenue += row.totalRevenue || 0;

      const st = row._id;
      if (st === "delivered" || st === "completed") deliveredCount += row.count;
      if (st === "pending") pendingCount += row.count;
      if (st === "cancelled") cancelledCount += row.count;
    });

    res.json({
      ok: true,
      summary: {
        totalOrders,
        totalRevenue,

        // frontend expects:
        deliveredCount,
        pendingCount,
        cancelledCount,

        // backward compatibility:
        delivered: deliveredCount,
        cancelled: cancelledCount,
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

/* ==========================================================
   5) AVAILABLE DRIVERS FOR ASSIGNMENT (NOT ON TRIP)
   GET /api/manager/orders/available-drivers
========================================================== */
export const getAvailableDriversForOrders = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res
        .status(400)
        .json({ ok: false, error: "Unable to resolve companyId" });
    }

    const shopId = resolveShopScope(req.user);

    const driverFilter = {
      role: "driver",
      companyId,
      isActive: true,
    };

    // keep if your drivers are shop-scoped
    if (shopId) driverFilter.shopId = shopId;

    const drivers = await User.find(driverFilter)
      .select("name phone email profileImage driverStatus isActive shopId")
      .sort({ createdAt: -1 })
      .lean();

    const available = drivers.filter(isDriverAvailable);

    // attach vehicle info
    const driverIds = available.map((d) => d._id);
    const vehicles = await Vehicle.find({ driverId: { $in: driverIds } })
      .select("driverId plateNumber brand model vehicleImage status")
      .lean();

    const vehicleMap = new Map();
    vehicles.forEach((v) => vehicleMap.set(String(v.driverId), v));

    const result = available.map((d) => ({
      ...d,
      vehicle: vehicleMap.get(String(d._id)) || null,
    }));

    return res.json({ ok: true, drivers: result });
  } catch (err) {
    console.error("❌ getAvailableDriversForOrders error:", err.message);
    return res
      .status(500)
      .json({ ok: false, error: "Server error loading drivers" });
  }
};

/* ==========================================================
   6) ASSIGN DRIVER TO ORDER (DISPATCH)
   PATCH /api/manager/orders/:orderId/assign-driver
   body: { driverId }
========================================================== */
export const assignDriverToOrder = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res
        .status(400)
        .json({ ok: false, error: "Unable to resolve companyId" });
    }

    const shopId = resolveShopScope(req.user);
    const { orderId } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ ok: false, error: "driverId is required" });
    }

    const orderMatch = { _id: orderId, companyId };
    if (shopId) orderMatch.shopId = shopId;

    const order = await Order.findOne(orderMatch);
    if (!order) {
      return res
        .status(404)
        .json({ ok: false, error: "Order not found for your scope" });
    }

    const blockedStatuses = ["delivered", "completed", "cancelled"];
    if (blockedStatuses.includes(order.status)) {
      return res.status(400).json({
        ok: false,
        error: `Cannot assign order with status: ${order.status}`,
      });
    }

    // Load driver
    const driver = await User.findOne({
      _id: driverId,
      role: "driver",
      companyId,
    }).select("name email phone profileImage driverStatus isActive shopId");

    if (!driver) {
      return res.status(404).json({ ok: false, error: "Driver not found" });
    }

    if (shopId && String(driver.shopId || "") !== String(shopId)) {
      return res
        .status(403)
        .json({ ok: false, error: "Driver is not in your shop scope" });
    }

    if (!isDriverAvailable(driver)) {
      return res.status(400).json({
        ok: false,
        error: "Driver is not available (on trip / inactive)",
      });
    }

    // Vehicle
    const vehicle = await Vehicle.findOne({
      driverId: driver._id,
      companyId,
    })
      .select("plateNumber brand model vehicleImage status")
      .lean();

    // Create Trip (matches your Trip schema)
    let trip = null;

    if (order.tripId) {
      trip = await Trip.findById(order.tripId);
    }

    const confirmationCode = generateConfirmationCode(6);

    const orderItems = Array.isArray(order.items)
      ? order.items.map((it) => ({
          productId: it.productId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          subtotal: it.subtotal,
        }))
      : [];

    if (!trip) {
      trip = await Trip.create({
        companyId,

        driverId: driver._id,
        customerId: order.customerId || null,
        vehicleId: vehicle?._id || order.vehicleId || null, // if you store vehicleId ObjectId in Vehicle collection

        // cart snapshot
        orderItems,
        totalAmount: Number(order.total || 0),

        pickupLocation: order.pickupLocation,
        dropoffLocation: order.dropoffLocation,

        deliveryFee: Number(order.deliveryFee || 0),

        status: "assigned",
        paymentStatus: "unpaid",

        createdByCustomer: true,
        customerAddress: order.dropoffLocation?.address || "",
        customerPhone: "", // if you store customer phone elsewhere keep it empty here
        customerNotes: order.customerNotes || "",

        startTime: new Date(),
        endTime: null,

        totalDistance: 0,
        routeHistory: [],

        customerConfirmed: false,
        confirmationTime: null,

        liveStatus: "Driver Assigned",
        confirmationCode,
      });

      order.tripId = trip._id;
    } else {
      // Update existing trip
      trip.driverId = driver._id;
      trip.vehicleId = vehicle?._id || trip.vehicleId || null;
      trip.status = "assigned";
      trip.liveStatus = "Driver Assigned";
      trip.startTime = trip.startTime || new Date();
      trip.confirmationCode = confirmationCode; // regenerate each assign
      await trip.save();
    }

    // Update order
    order.driverId = driver._id;
    // IMPORTANT: if your Order.vehicleId expects Vehicle ObjectId, set it here.
    // if your vehicle model uses _id, use vehicle?._id, otherwise keep old.
    order.vehicleId = vehicle?._id || order.vehicleId || null;
    order.status = "assigned";
    pushTimeline(order, "assigned_driver", {
      by: req.user?._id,
      driverId: driver._id,
      tripId: trip._id,
    });
    await order.save();

    // Update driver status
    driver.driverStatus = "on_trip";
    await driver.save();

    // Load customer + populate for socket payload
    const customer = await User.findById(order.customerId)
      .select("name email phone profileImage isActive")
      .lean();

    // Build “tracking code” for customer (use tripId as tracking code)
    const trackingTripId = String(trip._id);

    // 🔴 SEND TO DRIVER (customer address + map coords)
    emitToUser(req, driver._id, "order:assigned", {
      orderId: String(order._id),
      tripId: trackingTripId,
      confirmationCode, // optional: driver can also see code
      pickup: {
        address: order.pickupLocation?.address || "",
        lat: order.pickupLocation?.lat ?? null,
        lng: order.pickupLocation?.lng ?? null,
        mapsLink: buildMapsLink(
          order.pickupLocation?.lat,
          order.pickupLocation?.lng,
          order.pickupLocation?.address
        ),
      },
      dropoff: {
        address: order.dropoffLocation?.address || "",
        lat: order.dropoffLocation?.lat ?? null,
        lng: order.dropoffLocation?.lng ?? null,
        mapsLink: buildMapsLink(
          order.dropoffLocation?.lat,
          order.dropoffLocation?.lng,
          order.dropoffLocation?.address
        ),
      },
      customer: customer
        ? {
            _id: String(customer._id),
            name: customer.name,
            phone: customer.phone,
            profileImage: customer.profileImage,
          }
        : null,
    });

    // 🔴 SEND TO CUSTOMER (driver + vehicle + trackingTripId)
    emitToUser(req, order.customerId, "order:driver_assigned", {
      orderId: String(order._id),
      tripId: trackingTripId, // customer uses this to track on map
      driver: {
        _id: String(driver._id),
        name: driver.name,
        phone: driver.phone,
        profileImage: driver.profileImage,
        driverStatus: driver.driverStatus,
      },
      vehicle: vehicle
        ? {
            plateNumber: vehicle.plateNumber,
            brand: vehicle.brand,
            model: vehicle.model,
            vehicleImage: vehicle.vehicleImage,
          }
        : null,
      // customer shows QR on delivery OR can show code (optional)
      confirmationCode,
    });

    // Return updated populated order for frontend
    const updated = await Order.findById(order._id)
      .populate("customerId", "name email phone profileImage")
      .populate("driverId", "name phone profileImage driverStatus isActive")
      .populate("vehicleId", "plateNumber brand model vehicleImage")
      .lean();

    return res.json({
      ok: true,
      message: "Driver assigned successfully",
      order: updated,
      tripId: trip._id,
      trackingTripId,
      confirmationCode,
    });
  } catch (err) {
    console.error("❌ assignDriverToOrder error:", err.message);
    return res
      .status(500)
      .json({ ok: false, error: "Server error assigning driver" });
  }
};

/* ==========================================================
   7) GENERATE DELIVERY QR TOKEN (PROOF)
   POST /api/manager/orders/:orderId/generate-qr
   Returns: { qrPayload, expiresAt }
==========================================================
   ⚠️ Requires these fields in Order model:
   - deliveryQrTokenHash: String
   - deliveryQrExpiresAt: Date
========================================================== */
export const generateOrderDeliveryQr = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res
        .status(400)
        .json({ ok: false, error: "Unable to resolve companyId" });
    }

    const shopId = resolveShopScope(req.user);
    const { orderId } = req.params;

    const match = { _id: orderId, companyId };
    if (shopId) match.shopId = shopId;

    const order = await Order.findOne(match);
    if (!order) {
      return res
        .status(404)
        .json({ ok: false, error: "Order not found for your scope" });
    }

    // raw token (embed in QR)
    const rawToken = crypto.randomBytes(24).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // expires in 12 hours
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    order.deliveryQrTokenHash = tokenHash;
    order.deliveryQrExpiresAt = expiresAt;

    pushTimeline(order, "generated_delivery_qr", { by: req.user?._id });
    await order.save();

    // QR payload
    const qrPayload = JSON.stringify({
      type: "order_delivery",
      orderId: String(order._id),
      token: rawToken,
    });

    return res.json({ ok: true, qrPayload, expiresAt });
  } catch (err) {
    console.error("❌ generateOrderDeliveryQr error:", err.message);
    return res
      .status(500)
      .json({ ok: false, error: "Server error generating QR" });
  }
};

/* ==========================================================
   8) VERIFY DELIVERY QR (PROOF OF DELIVERY)
   POST /api/manager/orders/:orderId/verify-qr
   body: { token }
==========================================================
   - validates token hash + expiry
   - marks Order delivered/completed
   - marks Trip delivered + customerConfirmed + confirmationTime
   - returns driver to "waiting"
   - emits socket updates to driver + customer
========================================================== */
export const verifyOrderDeliveryQr = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res
        .status(400)
        .json({ ok: false, error: "Unable to resolve companyId" });
    }

    const shopId = resolveShopScope(req.user);
    const { orderId } = req.params;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ ok: false, error: "token is required" });
    }

    const match = { _id: orderId, companyId };
    if (shopId) match.shopId = shopId;

    const order = await Order.findOne(match);
    if (!order) {
      return res
        .status(404)
        .json({ ok: false, error: "Order not found for your scope" });
    }

    // Already finished?
    const doneStatuses = ["delivered", "completed", "cancelled"];
    if (doneStatuses.includes(order.status)) {
      return res.status(400).json({
        ok: false,
        error: `Order already in final status: ${order.status}`,
      });
    }

    // Validate stored hash + expiry
    if (!order.deliveryQrTokenHash || !order.deliveryQrExpiresAt) {
      return res.status(400).json({
        ok: false,
        error: "No active delivery QR token for this order",
      });
    }

    if (new Date(order.deliveryQrExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({
        ok: false,
        error: "QR token expired",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    if (tokenHash !== order.deliveryQrTokenHash) {
      return res.status(400).json({
        ok: false,
        error: "Invalid QR token",
      });
    }

    // Update trip
    let trip = null;
    if (order.tripId) {
      trip = await Trip.findById(order.tripId);
      if (trip) {
        trip.status = "delivered";
        trip.liveStatus = "Delivered";
        trip.endTime = new Date();
        trip.customerConfirmed = true;
        trip.confirmationTime = new Date();
        await trip.save();
      }
    }

    // Update order (you can choose delivered OR completed)
    order.status = "completed";
    pushTimeline(order, "delivery_confirmed_qr", {
      by: req.user?._id,
      tripId: order.tripId || null,
    });

    // Invalidate token (one-time use)
    order.deliveryQrTokenHash = null;
    order.deliveryQrExpiresAt = null;

    await order.save();

    // Driver back to waiting
    if (order.driverId) {
      await User.updateOne(
        { _id: order.driverId, companyId, role: "driver" },
        { $set: { driverStatus: "waiting" } }
      );
    }

    // Socket updates
    if (order.driverId) {
      emitToUser(req, order.driverId, "order:delivered", {
        orderId: String(order._id),
        tripId: order.tripId ? String(order.tripId) : null,
        status: order.status,
        deliveredAt: new Date().toISOString(),
      });
    }

    if (order.customerId) {
      emitToUser(req, order.customerId, "order:delivered", {
        orderId: String(order._id),
        tripId: order.tripId ? String(order.tripId) : null,
        status: order.status,
        deliveredAt: new Date().toISOString(),
      });
    }

    return res.json({
      ok: true,
      message: "Delivery confirmed successfully",
      orderId: order._id,
      tripId: order.tripId || null,
      status: order.status,
    });
  } catch (err) {
    console.error("❌ verifyOrderDeliveryQr error:", err.message);
    return res
      .status(500)
      .json({ ok: false, error: "Server error verifying QR" });
  }
};
