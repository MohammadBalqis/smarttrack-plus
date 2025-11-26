// server/src/controllers/orderController.js
import Order from "../models/Order.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import {
  createNotification,
  getPopulatedTripForNotify,
  broadcastTripStatus,
} from "./trip/tripHelpers.js";

import { resolveCompanyId } from "../utils/resolveCompanyId.js";

/* ==========================================================
   1) CUSTOMER CREATES ORDER
========================================================== */
export const createOrder = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { companyId, items, pickupLocation, dropoffLocation, customerNotes } =
      req.body;

    if (!companyId || !items?.length) {
      return res.status(400).json({ error: "Missing order data" });
    }

    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const deliveryFee = 3; // default
    const total = subtotal + deliveryFee;

    const order = await Order.create({
      customerId,
      companyId,
      items,
      subtotal,
      deliveryFee,
      total,
      pickupLocation,
      dropoffLocation,
      customerNotes,
    });

    // Notify company
    await createNotification(req, {
      userId: companyId,
      title: "New Order Received",
      message: `A new order was created.`,
      type: "order",
      category: "company",
      relatedOrderId: order._id,
    });

    res.status(201).json({
      ok: true,
      order,
    });
  } catch (err) {
    console.error("❌ createOrder error:", err.message);
    res.status(500).json({ error: "Server error creating order" });
  }
};

/* ==========================================================
   2) COMPANY ACCEPTS ORDER
========================================================== */
export const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const companyId = resolveCompanyId(req.user);

    const order = await Order.findOne({
      _id: orderId,
      companyId,
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = "accepted";
    order.timeline.push({ status: "accepted" });
    await order.save();

    // Notify customer
    await createNotification(req, {
      userId: order.customerId,
      title: "Order Accepted",
      message: "Your order is being prepared.",
      type: "order",
      category: "customer",
      relatedOrderId: order._id,
    });

    res.json({ ok: true, order });
  } catch (err) {
    console.error("❌ acceptOrder error:", err.message);
    res.status(500).json({ error: "Server error accepting order" });
  }
};

/* ==========================================================
   3) ASSIGN DRIVER + VEHICLE (becomes a Trip)
========================================================== */
export const assignOrderDriver = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driverId, vehicleId, deliveryFee } = req.body;

    const companyId = resolveCompanyId(req.user);

    const order = await Order.findOne({
      _id: orderId,
      companyId,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Ensure vehicle belongs to company
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      companyId,
    });

    if (!vehicle) {
      return res.status(400).json({
        error: "Vehicle not found or does not belong to company",
      });
    }

    if (vehicle.status === "maintenance") {
      return res.status(400).json({
        error: "Vehicle under maintenance",
      });
    }

    // ---- CREATE TRIP ----------
    const trip = await Trip.create({
      companyId,
      driverId,
      customerId: order.customerId,
      vehicleId,
      orderItems: order.items,
      deliveryFee: deliveryFee || order.deliveryFee,
      pickupLocation: order.pickupLocation,
      dropoffLocation: order.dropoffLocation,
      status: "assigned",
      startTime: new Date(),
    });

    order.driverId = driverId;
    order.vehicleId = vehicleId;
    order.tripId = trip._id;
    order.status = "assigned";

    order.timeline.push({ status: "assigned" });
    await order.save();

    vehicle.status = "in_use";
    vehicle.driverId = driverId;
    await vehicle.save();

    // Notify driver + customer
    await createNotification(req, {
      userId: driverId,
      title: "New Delivery Assigned",
      message: "A delivery order has been assigned to you.",
      type: "assignment",
      category: "driver",
      relatedTripId: trip._id,
    });

    await createNotification(req, {
      userId: order.customerId,
      title: "Driver Assigned",
      message: "Your delivery is on the way.",
      type: "order",
      category: "customer",
      relatedTripId: trip._id,
    });

    res.json({
      ok: true,
      order,
      trip,
    });
  } catch (err) {
    console.error("❌ assignOrderDriver error:", err.message);
    res.status(500).json({ error: "Server error assigning driver" });
  }
};

/* ==========================================================
   4) UPDATE ORDER STATUS
========================================================== */
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const companyId = resolveCompanyId(req.user);

    const order = await Order.findOne({
      _id: orderId,
      companyId,
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    order.timeline.push({ status });
    await order.save();

    // Notify customer
    await createNotification(req, {
      userId: order.customerId,
      title: "Order Update",
      message: `Your order status changed to ${status}.`,
      type: "order",
      category: "customer",
      relatedOrderId: order._id,
    });

    res.json({ ok: true, order });
  } catch (err) {
    console.error("❌ updateOrderStatus error:", err.message);
    res.status(500).json({ error: "Error updating status" });
  }
};

/* ==========================================================
   5) CANCEL ORDER
========================================================== */
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const companyId = resolveCompanyId(req.user);

    const order = await Order.findOne({
      _id: orderId,
      companyId,
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = "cancelled";
    order.timeline.push({ status: "cancelled" });
    await order.save();

    await createNotification(req, {
      userId: order.customerId,
      title: "Order Cancelled",
      message: `Your order was cancelled. Reason: ${reason}`,
      type: "order",
      category: "customer",
      relatedOrderId: order._id,
    });

    res.json({ ok: true, order });
  } catch (err) {
    console.error("❌ cancelOrder error:", err.message);
    res.status(500).json({ error: "Server error cancelling order" });
  }
};

/* ==========================================================
   6) GET ORDERS FOR COMPANY / MANAGER
========================================================== */
export const getCompanyOrders = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    const orders = await Order.find({ companyId })
      .populate("customerId", "name phone email")
      .populate("driverId", "name phone")
      .populate("vehicleId")
      .sort({ createdAt: -1 });

    res.json({ ok: true, count: orders.length, orders });
  } catch (err) {
    console.error("❌ getCompanyOrders error:", err.message);
    res.status(500).json({ error: "Server error loading orders" });
  }
};

/* ==========================================================
   7) GET ORDERS FOR CUSTOMER
========================================================== */
export const getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.user._id;

    const orders = await Order.find({ customerId })
      .populate("companyId", "name email")
      .populate("driverId", "name")
      .sort({ createdAt: -1 });

    res.json({ ok: true, orders });
  } catch (err) {
    console.error("❌ getCustomerOrders error:", err.message);
    res.status(500).json({ error: "Error fetching customers orders" });
  }
};
