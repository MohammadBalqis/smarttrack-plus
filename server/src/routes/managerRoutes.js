// server/src/routes/managerRoutes.js
import { Router } from "express";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { logActivity } from "../utils/activityLogger.js";

const router = Router();

/* ==========================================================
   🧠 Helpers
   ========================================================== */

// Get companyId depending on role
const getCompanyId = (user) =>
  user.role === "company" ? user._id : user.companyId;

// Build filter for drivers visible to the current user
const buildDriverFilter = (req) => {
  const companyId = getCompanyId(req.user);
  const filter = { companyId, role: "driver" };

  // If manager → only see his own drivers
  if (req.user.role === "manager") {
    filter.managerId = req.user._id;
  }

  return filter;
};

// Socket emit helper
const emitToUser = (req, userId, event, payload) => {
  try {
    const io = req.app.get("io");
    if (io && userId) {
      io.to(String(userId)).emit(event, payload);
    }
  } catch (err) {
    console.error("⚠ Socket emit error:", err.message);
  }
};

const getPopulatedTripForNotify = async (tripId) => {
  return Trip.findById(tripId)
    .populate("driverId", "name email phone profileImage")
    .populate("vehicleId", "type brand model plateNumber status vehicleImage")
    .populate("customerId", "name email phone")
    .populate("companyId", "name email companyName");
};

const createNotification = async (
  req,
  { userId, title, message, type, relatedTripId, extra = {} }
) => {
  if (!userId) return;

  const noti = await Notification.create({
    userId,
    title,
    message,
    type,
    relatedTripId: relatedTripId || null,
  });

  emitToUser(req, userId, "notify", {
    _id: noti._id,
    userId,
    title,
    message,
    type,
    relatedTripId: relatedTripId || null,
    createdAt: noti.createdAt,
    ...extra,
  });
};

/* ==========================================================
   1️⃣ MANAGER / COMPANY — Drivers Overview List
   ========================================================== */
/*
GET /api/manager/drivers

Query (optional):
  ?search=ali           (name or email)
  ?onlyActive=true      (filter by isActive=true)
*/
router.get(
  "/drivers",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { search, onlyActive } = req.query;
      const driverFilter = buildDriverFilter(req);

      if (search) {
        driverFilter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      if (onlyActive === "true") {
        driverFilter.isActive = true;
      }

      // 🔹 Fetch drivers
      const drivers = await User.find(driverFilter)
        .select(
          "name email profileImage isActive driverOrdersCount managerId createdAt"
        )
        .sort({ createdAt: -1 });

      const driverIds = drivers.map((d) => d._id);

      if (driverIds.length === 0) {
        return res.json({
          ok: true,
          count: 0,
          drivers: [],
          statsByDriver: {},
        });
      }

      const companyId = getCompanyId(req.user);

      // 🔹 Aggregate trip stats per driver
      const tripsAgg = await Trip.aggregate([
        {
          $match: {
            companyId,
            driverId: { $in: driverIds },
          },
        },
        {
          $group: {
            _id: "$driverId",
            totalTrips: { $sum: 1 },
            completedTrips: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            activeTrips: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["assigned", "in_progress"]] },
                  1,
                  0,
                ],
              },
            },
            totalDeliveryFees: { $sum: "$deliveryFee" },
          },
        },
      ]);

      // 🔹 Aggregate payment stats per driver
      const paymentsAgg = await Payment.aggregate([
        {
          $match: {
            companyId,
            driverId: { $in: driverIds },
            status: "paid",
          },
        },
        {
          $group: {
            _id: "$driverId",
            totalPaidAmount: { $sum: "$amount" },
          },
        },
      ]);

      const tripStatsMap = {};
      tripsAgg.forEach((row) => {
        tripStatsMap[row._id.toString()] = row;
      });

      const paymentStatsMap = {};
      paymentsAgg.forEach((row) => {
        paymentStatsMap[row._id.toString()] = row;
      });

      // 🔹 Combine into a clean stats object keyed by driverId
      const statsByDriver = {};
      drivers.forEach((driver) => {
        const id = driver._id.toString();
        const t = tripStatsMap[id] || {};
        const p = paymentStatsMap[id] || {};

        statsByDriver[id] = {
          totalTrips: t.totalTrips || 0,
          completedTrips: t.completedTrips || 0,
          activeTrips: t.activeTrips || 0,
          totalDeliveryFees: t.totalDeliveryFees || 0,
          totalPaidAmount: p.totalPaidAmount || 0,
        };
      });

      res.json({
        ok: true,
        count: drivers.length,
        drivers,
        statsByDriver,
      });
    } catch (err) {
      console.error("❌ Manager drivers list error:", err.message);
      res.status(500).json({ error: "Server error loading drivers" });
    }
  }
);

/* ==========================================================
   2️⃣ MANAGER / COMPANY — Single Driver Details + Last Trips
   ========================================================== */
/*
GET /api/manager/drivers/:driverId
*/
router.get(
  "/drivers/:driverId",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { driverId } = req.params;
      const driverFilter = buildDriverFilter(req);
      driverFilter._id = driverId;

      const driver = await User.findOne(driverFilter).select("-passwordHash");

      if (!driver) {
        return res
          .status(404)
          .json({ error: "Driver not found or not in your company/team" });
      }

      const companyId = getCompanyId(req.user);

      // 🔹 Driver trips stats
      const tripsAgg = await Trip.aggregate([
        {
          $match: {
            companyId,
            driverId: driver._id,
          },
        },
        {
          $group: {
            _id: "$driverId",
            totalTrips: { $sum: 1 },
            completedTrips: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            activeTrips: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["assigned", "in_progress"]] },
                  1,
                  0,
                ],
              },
            },
            totalDeliveryFees: { $sum: "$deliveryFee" },
          },
        },
      ]);

      const tripStats = tripsAgg[0] || {
        totalTrips: 0,
        completedTrips: 0,
        activeTrips: 0,
        totalDeliveryFees: 0,
      };

      const paymentsAgg = await Payment.aggregate([
        {
          $match: {
            companyId,
            driverId: driver._id,
            status: "paid",
          },
        },
        {
          $group: {
            _id: "$driverId",
            totalPaidAmount: { $sum: "$amount" },
          },
        },
      ]);

      const paymentStats = paymentsAgg[0] || { totalPaidAmount: 0 };

      // 🔹 Last 10 trips for this driver
      const lastTrips = await Trip.find({
        companyId,
        driverId: driver._id,
      })
        .populate("customerId", "name email")
        .populate("vehicleId", "brand model plateNumber")
        .sort({ createdAt: -1 })
        .limit(10);

      res.json({
        ok: true,
        driver,
        stats: {
          totalTrips: tripStats.totalTrips || 0,
          completedTrips: tripStats.completedTrips || 0,
          activeTrips: tripStats.activeTrips || 0,
          totalDeliveryFees: tripStats.totalDeliveryFees || 0,
          totalPaidAmount: paymentStats.totalPaidAmount || 0,
        },
        lastTrips,
      });
    } catch (err) {
      console.error("❌ Manager driver details error:", err.message);
      res.status(500).json({ error: "Server error loading driver details" });
    }
  }
);

/* ==========================================================
   3️⃣ MANAGER / COMPANY — Toggle Driver Active / Inactive
   ========================================================== */
/*
PATCH /api/manager/drivers/:driverId/toggle-active
Body: { "isActive": true }
*/
router.patch(
  "/drivers/:driverId/toggle-active",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { driverId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res
          .status(400)
          .json({ error: "isActive must be true or false" });
      }

      const driverFilter = buildDriverFilter(req);
      driverFilter._id = driverId;

      const driver = await User.findOneAndUpdate(
        driverFilter,
        { isActive },
        { new: true }
      ).select("-passwordHash");

      if (!driver) {
        return res
          .status(404)
          .json({ error: "Driver not found or not in your company/team" });
      }

      await logActivity({
        userId: req.user._id,
        action: "MANAGER_TOGGLE_DRIVER_ACTIVE",
        description: `Set driver ${driver._id} active=${isActive}`,
        targetUserId: driver._id,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });

      res.json({
        ok: true,
        message: `Driver set to ${isActive ? "active" : "inactive"}`,
        driver,
      });
    } catch (err) {
      console.error("❌ Toggle driver active error:", err.message);
      res.status(500).json({ error: "Server error updating driver status" });
    }
  }
);

/* ==========================================================
   4️⃣ MANAGER / COMPANY — Update Driver Notes
   ========================================================== */
/*
PATCH /api/manager/drivers/:driverId/notes
Body: { "driverNotes": "Very punctual..." }
*/
router.patch(
  "/drivers/:driverId/notes",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { driverId } = req.params;
      const { driverNotes } = req.body;

      const driverFilter = buildDriverFilter(req);
      driverFilter._id = driverId;

      const driver = await User.findOneAndUpdate(
        driverFilter,
        { driverNotes: driverNotes || "" },
        { new: true }
      ).select("-passwordHash");

      if (!driver) {
        return res
          .status(404)
          .json({ error: "Driver not found or not in your company/team" });
      }

      await logActivity({
        userId: req.user._id,
        action: "MANAGER_UPDATE_DRIVER_NOTES",
        description: `Updated notes for driver ${driver._id}`,
        targetUserId: driver._id,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });

      res.json({
        ok: true,
        message: "Driver notes updated",
        driver,
      });
    } catch (err) {
      console.error("❌ Update driver notes error:", err.message);
      res.status(500).json({ error: "Server error updating driver notes" });
    }
  }
);

/* ==========================================================
   5️⃣ MANAGER / COMPANY — Driver Monthly Performance
   ========================================================== */
/*
GET /api/manager/drivers/:driverId/performance?month=2025-11
*/
router.get(
  "/drivers/:driverId/performance",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { driverId } = req.params;
      const { month } = req.query;

      const driverFilter = buildDriverFilter(req);
      driverFilter._id = driverId;

      const driver = await User.findOne(driverFilter).select(
        "name email profileImage isActive driverOrdersCount"
      );
      if (!driver) {
        return res
          .status(404)
          .json({ error: "Driver not found or not in your company/team" });
      }

      const companyId = getCompanyId(req.user);

      // Determine month range
      let startDate, endDate;
      if (month) {
        const [year, m] = month.split("-").map(Number);
        startDate = new Date(year, m - 1, 1);
        endDate = new Date(year, m, 1);
      } else {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      const tripsAgg = await Trip.aggregate([
        {
          $match: {
            companyId,
            driverId: driver._id,
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: "$driverId",
            totalTrips: { $sum: 1 },
            completedTrips: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            totalDeliveryFees: { $sum: "$deliveryFee" },
            totalDistance: { $sum: "$totalDistance" },
          },
        },
      ]);

      const stats = tripsAgg[0] || {
        totalTrips: 0,
        completedTrips: 0,
        totalDeliveryFees: 0,
        totalDistance: 0,
      };

      const paymentsAgg = await Payment.aggregate([
        {
          $match: {
            companyId,
            driverId: driver._id,
            status: "paid",
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: "$driverId",
            totalPaidAmount: { $sum: "$amount" },
          },
        },
      ]);

      const paymentStats = paymentsAgg[0] || { totalPaidAmount: 0 };

      res.json({
        ok: true,
        driver,
        monthRange: { startDate, endDate },
        performance: {
          totalTrips: stats.totalTrips,
          completedTrips: stats.completedTrips,
          totalDeliveryFees: stats.totalDeliveryFees,
          totalDistance: stats.totalDistance,
          totalPaidAmount: paymentStats.totalPaidAmount,
        },
      });
    } catch (err) {
      console.error("❌ Driver performance error:", err.message);
      res.status(500).json({ error: "Server error loading performance" });
    }
  }
);

/* ==========================================================
   6️⃣ MANAGER / COMPANY — Assignment Data
   ========================================================== */
/*
GET /api/manager/assign/data
*/
router.get(
  "/assign/data",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const companyId = getCompanyId(req.user);

      // 1) Pending orders
      const pendingOrders = await Trip.find({
        companyId,
        status: "pending",
      })
        .sort({ createdAt: -1 })
        .populate("customerId", "name email")
        .populate("driverId", "name email")
        .populate("vehicleId", "brand model plateNumber");

      // 2) Active trips to know busy driver/vehicle
      const activeTrips = await Trip.find({
        companyId,
        status: { $in: ["assigned", "in_progress"] },
      }).select("driverId vehicleId");

      const busyDriverIds = [
        ...new Set(
          activeTrips
            .map((t) => t.driverId)
            .filter((id) => !!id)
            .map((id) => id.toString())
        ),
      ];
      const busyVehicleIds = [
        ...new Set(
          activeTrips
            .map((t) => t.vehicleId)
            .filter((id) => !!id)
            .map((id) => id.toString())
        ),
      ];

      // 3) Available drivers
      const driverFilter = buildDriverFilter(req);
      driverFilter.isActive = true;
      if (busyDriverIds.length > 0) {
        driverFilter._id = { $nin: busyDriverIds };
      }

      const availableDrivers = await User.find(driverFilter).select(
        "name email profileImage driverOrdersCount isActive"
      );

      // 4) Available vehicles
      const vehicleFilter = {
        companyId,
        status: { $ne: "maintenance" },
      };
      if (busyVehicleIds.length > 0) {
        vehicleFilter._id = { $nin: busyVehicleIds };
      }

      const availableVehicles = await Vehicle.find(vehicleFilter).select(
        "type brand model plateNumber status vehicleImage driverId"
      );

      res.json({
        ok: true,
        pendingOrders,
        availableDrivers,
        availableVehicles,
      });
    } catch (err) {
      console.error("❌ Manager assign data error:", err.message);
      res.status(500).json({ error: "Server error loading assignment data" });
    }
  }
);

/* ==========================================================
   6️⃣B MANAGER / COMPANY — Assign Pending Order
   ========================================================== */
/*
POST /api/manager/assign
*/
router.post(
  "/assign",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { tripId, driverId, vehicleId, deliveryFee } = req.body;

      if (!tripId || !driverId || !vehicleId) {
        return res.status(400).json({
          error: "tripId, driverId and vehicleId are required",
        });
      }

      const companyId = getCompanyId(req.user);

      // 1) Find trip
      const trip = await Trip.findOne({
        _id: tripId,
        companyId,
      });

      if (!trip) {
        return res.status(404).json({
          error: "Trip not found for your company",
        });
      }

      if (trip.status !== "pending") {
        return res.status(400).json({
          error: `Trip cannot be assigned (current status = ${trip.status})`,
        });
      }

      // 2) Validate driver
      const driverFilter = buildDriverFilter(req);
      driverFilter._id = driverId;
      driverFilter.isActive = true;

      const driver = await User.findOne(driverFilter);

      if (!driver) {
        return res.status(400).json({
          error: "Driver not found or not eligible",
        });
      }

      const activeTripForDriver = await Trip.findOne({
        driverId,
        status: { $in: ["assigned", "in_progress"] },
      });

      if (activeTripForDriver) {
        return res.status(400).json({
          error: "Driver is currently assigned to an active trip",
        });
      }

      // 3) Validate vehicle
      const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        companyId,
        status: { $ne: "maintenance" },
      });

      if (!vehicle) {
        return res.status(400).json({
          error: "Vehicle not found or not available",
        });
      }

      const activeTripForVehicle = await Trip.findOne({
        vehicleId,
        status: { $in: ["assigned", "in_progress"] },
      });

      if (activeTripForVehicle) {
        return res.status(400).json({
          error: "Vehicle is currently assigned to an active trip",
        });
      }

      // 4) Assign trip
      trip.driverId = driverId;
      trip.vehicleId = vehicleId;
      trip.status = "assigned";
      trip.startTime = new Date();

      if (typeof deliveryFee === "number") {
        trip.deliveryFee = deliveryFee;
      }

      await trip.save();

      // 5) Update vehicle status
      vehicle.status = "in_use";
      vehicle.driverId = driverId;
      await vehicle.save();

      // 🔔 Notifications
      const populatedTrip = await getPopulatedTripForNotify(trip._id);
      const payloadCommon = {
        trip: populatedTrip,
        driver: populatedTrip.driverId,
        vehicle: populatedTrip.vehicleId,
        customer: populatedTrip.customerId,
      };

      // Notify driver
      await createNotification(req, {
        userId: populatedTrip.driverId?._id,
        title: "New Trip Assigned",
        message: "You have been assigned a new delivery.",
        type: "assignment",
        relatedTripId: populatedTrip._id,
        extra: payloadCommon,
      });

      // Notify customer
      await createNotification(req, {
        userId: populatedTrip.customerId?._id,
        title: "Driver Assigned",
        message: "A driver has been assigned to your order.",
        type: "status",
        relatedTripId: populatedTrip._id,
        extra: payloadCommon,
      });

      await logActivity({
        userId: req.user._id,
        action: "MANAGER_ASSIGN_TRIP",
        description: `Assigned driver ${driverId} and vehicle ${vehicleId} to trip ${tripId}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });

      res.json({
        ok: true,
        message: "Trip assigned successfully",
        trip,
      });
    } catch (err) {
      console.error("❌ Assign trip error:", err.message);
      res.status(500).json({
        error: "Server error assigning trip",
      });
    }
  }
);

/* ==========================================================
   6️⃣C MANAGER / COMPANY — Reassign Trip (Change Driver/Vehicle)
   ========================================================== */
/*
PATCH /api/manager/reassign
Body: { tripId, newDriverId, newVehicleId }
*/
router.patch(
  "/reassign",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { tripId, newDriverId, newVehicleId } = req.body;

      if (!tripId || !newDriverId || !newVehicleId) {
        return res.status(400).json({
          error: "tripId, newDriverId, and newVehicleId are required",
        });
      }

      const companyId = getCompanyId(req.user);

      // 1) Find trip
      const trip = await Trip.findOne({ _id: tripId, companyId });
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      if (["delivered", "cancelled"].includes(trip.status)) {
        return res.status(400).json({
          error: `Cannot reassign trip with status '${trip.status}'`,
        });
      }

      // 2) Free OLD vehicle
      if (trip.vehicleId) {
        await Vehicle.findByIdAndUpdate(trip.vehicleId, {
          status: "available",
          driverId: null,
        });
      }

      // 3) Validate NEW DRIVER
      const driverFilter = buildDriverFilter(req);
      driverFilter._id = newDriverId;
      driverFilter.isActive = true;

      const newDriver = await User.findOne(driverFilter);
      if (!newDriver) {
        return res
          .status(400)
          .json({ error: "New driver not found or inactive" });
      }

      const driverActiveTrip = await Trip.findOne({
        driverId: newDriverId,
        status: { $in: ["assigned", "in_progress"] },
      });

      if (driverActiveTrip) {
        return res.status(400).json({
          error: "This driver is already assigned to an active trip",
        });
      }

      // 4) Validate NEW VEHICLE
      const newVehicle = await Vehicle.findOne({
        _id: newVehicleId,
        companyId,
        status: { $ne: "maintenance" },
      });

      if (!newVehicle) {
        return res.status(400).json({
          error: "New vehicle not found or unavailable",
        });
      }

      const vehicleActiveTrip = await Trip.findOne({
        vehicleId: newVehicleId,
        status: { $in: ["assigned", "in_progress"] },
      });

      if (vehicleActiveTrip) {
        return res.status(400).json({
          error: "This vehicle is already assigned to an active trip",
        });
      }

      // 5) Apply reassignment
      trip.driverId = newDriverId;
      trip.vehicleId = newVehicleId;

      if (trip.status === "pending") {
        trip.status = "assigned";
        trip.startTime = new Date();
      }

      await trip.save();

      // 6) Update new vehicle status
      newVehicle.status = "in_use";
      newVehicle.driverId = newDriverId;
      await newVehicle.save();

      // 🔔 Notifications (driver + customer about driver change)
      const populatedTrip = await getPopulatedTripForNotify(trip._id);
      const payloadCommon = {
        trip: populatedTrip,
        driver: populatedTrip.driverId, // new driver
        vehicle: populatedTrip.vehicleId,
        customer: populatedTrip.customerId,
      };

      // Notify new driver
      await createNotification(req, {
        userId: populatedTrip.driverId?._id,
        title: "Trip Reassigned To You",
        message: "A delivery has been reassigned to you.",
        type: "assignment",
        relatedTripId: populatedTrip._id,
        extra: payloadCommon,
      });

      // Notify customer – new driver details
      await createNotification(req, {
        userId: populatedTrip.customerId?._id,
        title: "Driver Changed",
        message:
          "Your delivery driver has been changed. Please check the new driver details.",
        type: "update",
        relatedTripId: populatedTrip._id,
        extra: payloadCommon,
      });

      await logActivity({
        userId: req.user._id,
        action: "MANAGER_REASSIGN_TRIP",
        description: `Reassigned trip ${tripId} to driver ${newDriverId} & vehicle ${newVehicleId}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });

      res.json({
        ok: true,
        message: "Trip reassigned successfully",
        trip,
      });
    } catch (err) {
      console.error("❌ Reassign trip error:", err.message);
      res.status(500).json({ error: "Server error reassigning trip" });
    }
  }
);

export default router;
