// server/src/controllers/companyOrderController.js
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";

const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (user.role === "manager") return user.companyId;
  return null;
};

/* ==========================================================
   📦 GET ALL ORDERS (Company + Manager)
========================================================== */
export const getCompanyOrders = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    const query = { companyId };

    // Filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.customerId) query.customerId = req.query.customerId;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("customerId", "name email phone")
      .populate("driverId", "name phone")
      .populate("vehicleId", "plateNumber model brand");

    res.json({
      ok: true,
      total: orders.length,
      orders,
    });
  } catch (err) {
    console.error("❌ getCompanyOrders error:", err.message);
    res.status(500).json({ error: "Server error loading orders" });
  }
};

/* ==========================================================
   📄 GET SINGLE ORDER DETAILS
========================================================== */
export const getCompanyOrderDetails = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      companyId,
    })
      .populate("customerId", "name email phone")
      .populate("driverId", "name phone")
      .populate("vehicleId", "plateNumber model brand")
      .populate("tripId");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ ok: true, order });
  } catch (err) {
    console.error("❌ getCompanyOrderDetails error:", err.message);
    res.status(500).json({ error: "Server error loading order details" });
  }
};

/* ==========================================================
   🔄 UPDATE ORDER STATUS (owner ONLY)
========================================================== */
export const updateCompanyOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== "company") {
      return res.status(403).json({ error: "Only company owners can update orders" });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    const allowed = [
      "accepted",
      "preparing",
      "assigned",
      "delivering",
      "delivered",
      "cancelled",
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    const order = await Order.findOneAndUpdate(
      { _id: orderId, companyId: req.user._id },
      { status, $push: { timeline: { status } } },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ ok: true, message: "Order updated", order });
  } catch (err) {
    console.error("❌ updateCompanyOrderStatus error:", err.message);
    res.status(500).json({ error: "Error updating order status" });
  }
};
