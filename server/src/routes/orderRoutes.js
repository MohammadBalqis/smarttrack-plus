import { Router } from "express";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   🚚 ASSIGN ORDER TO DRIVER & VEHICLE
   ========================================================== */
router.put(
  "/assign/:orderId",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { driverId, vehicleId } = req.body;

      if (!driverId || !vehicleId)
        return res
          .status(400)
          .json({ error: "Driver ID and Vehicle ID are required" });

      // 1️⃣ Find the order
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      // 2️⃣ Find the driver
      const driver = await User.findById(driverId);
      if (!driver || driver.role !== "driver")
        return res.status(400).json({ error: "Invalid driver ID" });

      // 3️⃣ Find the vehicle
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle)
        return res.status(400).json({ error: "Invalid vehicle ID" });

      // 4️⃣ Ensure vehicle is available
      if (vehicle.status !== "available")
        return res
          .status(400)
          .json({ error: "Vehicle is not available for assignment" });

      // 5️⃣ Update order
      order.driverId = driverId;
      order.vehicleId = vehicleId;
      order.status = "in_progress";
      await order.save();

      // 6️⃣ Update driver & vehicle states
      driver.driverOrdersCount += 1;
      await driver.save();

      vehicle.status = "in_use";
      await vehicle.save();

      res.json({
        ok: true,
        message: "Order assigned successfully",
        order,
        driver: {
          id: driver._id,
          name: driver.name,
          driverOrdersCount: driver.driverOrdersCount,
        },
        vehicle: {
          id: vehicle._id,
          plateNumber: vehicle.plateNumber,
          status: vehicle.status,
        },
      });
    } catch (err) {
      console.error("❌ Error assigning order:", err.message);
      res.status(500).json({ error: "Server error assigning order" });
    }
  }
);
/* ==========================================================
   ✅ DRIVER MARKS ORDER AS DELIVERED
   ========================================================== */
router.put(
  "/complete/:orderId",
  protect,
  authorizeRoles("driver"),
  async (req, res) => {
    try {
      const { orderId } = req.params;

      // 1️⃣ Find the order
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      // 2️⃣ Check if this order belongs to the driver
      if (order.driverId?.toString() !== req.user._id.toString())
        return res.status(403).json({ error: "Not authorized for this order" });

      // 3️⃣ Check order status
      if (order.status !== "in_progress")
        return res
          .status(400)
          .json({ error: "Order is not currently in progress" });

      // 4️⃣ Update order status
      order.status = "delivered";
      order.deliveredAt = new Date();
      await order.save();

      // 5️⃣ Update driver’s order count
      req.user.driverOrdersCount = Math.max(0, req.user.driverOrdersCount - 1);
      await req.user.save();

      // 6️⃣ Free up the vehicle
      if (order.vehicleId) {
        const vehicle = await Vehicle.findById(order.vehicleId);
        if (vehicle) {
          vehicle.status = "available";
          await vehicle.save();
        }
      }

      res.json({
        ok: true,
        message: "Order marked as delivered successfully",
        order: {
          id: order._id,
          status: order.status,
          deliveredAt: order.deliveredAt,
        },
        driver: {
          id: req.user._id,
          name: req.user.name,
          driverOrdersCount: req.user.driverOrdersCount,
        },
      });
    } catch (err) {
      console.error("❌ Error completing order:", err.message);
      res.status(500).json({ error: "Server error completing order" });
    }
  }
);
/* ==========================================================
   ✅ CUSTOMER CONFIRMS DELIVERY (FINAL STAGE)
   ========================================================== */
router.put(
  "/confirm/:orderId",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const { orderId } = req.params;

      // 1️⃣ Find the order
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      // 2️⃣ Ensure it belongs to this customer
      if (order.customerId?.toString() !== req.user._id.toString())
        return res.status(403).json({ error: "Not authorized for this order" });

      // 3️⃣ Ensure the order has been delivered
      if (order.status !== "delivered")
        return res.status(400).json({
          error: "This order cannot be confirmed because it's not yet delivered",
        });

      // 4️⃣ Mark order as completed
      order.status = "completed";
      order.confirmedAt = new Date();
      await order.save();

      res.json({
        ok: true,
        message: "Delivery confirmed successfully",
        order: {
          id: order._id,
          status: order.status,
          confirmedAt: order.confirmedAt,
        },
        customer: {
          id: req.user._id,
          name: req.user.name,
        },
      });
    } catch (err) {
      console.error("❌ Error confirming delivery:", err.message);
      res.status(500).json({ error: "Server error confirming delivery" });
    }
  }
);

export default router;
