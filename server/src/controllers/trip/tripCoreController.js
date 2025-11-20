// server/src/controllers/trip/tripCoreController.js
import Trip from "../../models/Trip.js";
import Vehicle from "../../models/Vehicle.js";
import Payment from "../../models/Payment.js";
import User from "../../models/User.js";
import GlobalSettings from "../../models/GlobalSettings.js";
import { logActivity } from "../../utils/activityLogger.js";
import {
  getPopulatedTripForNotify,
  createNotification,
  broadcastTripStatus,
} from "./tripHelpers.js";

/* Helper: maintenance guard (superadmin bypass) */
const ensureNotInMaintenance = async (req, res) => {
  const settings = await GlobalSettings.findOne();
  if (settings?.maintenanceMode && req.user.role !== "superadmin") {
    res.status(503).json({
      ok: false,
      error: "System is under maintenance.",
    });
    return false;
  }
  return true;
};

/* ==========================================================
   🟢 1. Create a Trip (Company / Manager / Superadmin / Owner)
   ========================================================== */
export const createTrip = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    const {
      driverId,
      vehicleId,
      customerId,
      pickupLocation,
      dropoffLocation,
      deliveryFee,
      companyId: bodyCompanyId, // for superadmin/owner
    } = req.body;

    if (!driverId || !vehicleId || !customerId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let companyId;

    if (req.user.role === "company") {
      companyId = req.user._id;
    } else if (req.user.role === "manager") {
      companyId = req.user.companyId;
    } else if (req.user.role === "superadmin" || req.user.role === "owner") {
      companyId = bodyCompanyId;
    }

    if (!companyId) {
      return res.status(400).json({
        error:
          "companyId is required in body when creating a trip as superadmin/owner.",
      });
    }

    // Validate driver belongs to company
    const driver = await User.findOne({
      _id: driverId,
      role: "driver",
      companyId,
    });

    if (!driver) {
      return res.status(400).json({
        error: "Driver not found or does not belong to this company",
      });
    }

    // Validate vehicle belongs to company
    const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId });
    if (!vehicle) {
      return res.status(400).json({
        error: "Vehicle not found or not part of this company",
      });
    }

    if (vehicle.status === "maintenance") {
      return res.status(400).json({
        error: "Vehicle under maintenance — cannot assign",
      });
    }

    const trip = await Trip.create({
      driverId,
      vehicleId,
      customerId,
      companyId,
      pickupLocation,
      dropoffLocation,
      deliveryFee,
      status: "assigned",
      startTime: new Date(),
    });

    // Mark vehicle in use
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
      message: `A new delivery has been assigned to you.`,
      type: "assignment",
      category: "driver",
      relatedTripId: populatedTrip._id,
      image: populatedTrip.customerId?.profileImage || null,
      actionUrl: `/driver/trips/${populatedTrip._id}`,
      priority: "high",
      extraData: payloadCommon,
    });

    // Notify customer
    await createNotification(req, {
      userId: populatedTrip.customerId?._id,
      title: "Your Delivery Is On The Way",
      message: `Your order has been confirmed and a driver was assigned.`,
      type: "status",
      category: "customer",
      relatedTripId: populatedTrip._id,
      image: populatedTrip.driverId?.profileImage || null,
      actionUrl: `/customer/tracking/${populatedTrip._id}`,
      extraData: payloadCommon,
    });

    // 🔁 Realtime broadcast
    await broadcastTripStatus(req, trip._id);

    // 🧾 Activity log — critical event
    await logActivity({
      userId: req.user._id,
      action: "TRIP_CREATE",
      description: `Created trip ${trip._id} for customer ${customerId} using vehicle ${vehicleId}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
      meta: {
        tripId: trip._id,
        driverId,
        vehicleId,
        customerId,
        companyId,
      },
    });

    res.status(201).json({
      ok: true,
      message: "Trip created & driver/vehicle assigned",
      trip,
    });
  } catch (err) {
    console.error("❌ Trip creation error:", err.message);
    res.status(500).json({ error: "Server error creating trip" });
  }
};

/* ==========================================================
   🟣 1B. ASSIGN Driver + Vehicle to a Customer Order
   ========================================================== */
export const assignTrip = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    const {
      tripId,
      driverId,
      vehicleId,
      deliveryFee,
      companyId: bodyCompanyId, // for superadmin/owner
    } = req.body;

    if (!tripId || !driverId || !vehicleId) {
      return res.status(400).json({
        error: "tripId, driverId, vehicleId are required",
      });
    }

    let companyId;

    if (req.user.role === "company") {
      companyId = req.user._id;
    } else if (req.user.role === "manager") {
      companyId = req.user.companyId;
    } else if (req.user.role === "superadmin" || req.user.role === "owner") {
      companyId = bodyCompanyId;
    }

    if (!companyId) {
      return res.status(400).json({
        error:
          "companyId is required in body when assigning as superadmin/owner.",
      });
    }

    // Get pending trip
    const trip = await Trip.findOne({ _id: tripId, companyId });
    if (!trip) {
      return res.status(404).json({
        error: "Trip not found for this company",
      });
    }

    if (trip.status !== "pending") {
      return res.status(400).json({
        error: `Trip cannot be assigned. Current status: ${trip.status}`,
      });
    }

    // Validate driver
    const driver = await User.findOne({
      _id: driverId,
      role: "driver",
      companyId,
    });

    if (!driver) {
      return res.status(400).json({
        error: "Driver not found or not part of this company",
      });
    }

    // Validate vehicle
    const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId });
    if (!vehicle) {
      return res.status(400).json({
        error: "Vehicle not found or not part of this company",
      });
    }

    if (vehicle.status === "maintenance") {
      return res.status(400).json({
        error: "Vehicle under maintenance — cannot assign",
      });
    }

    // Assign trip
    trip.driverId = driverId;
    trip.vehicleId = vehicleId;
    trip.status = "assigned";
    trip.startTime = new Date();
    if (typeof deliveryFee === "number") trip.deliveryFee = deliveryFee;
    await trip.save();

    // Update vehicle status
    vehicle.status = "in_use";
    vehicle.driverId = driverId;
    await vehicle.save();

    // 🔔 Notifications (assignment)
    const populatedTrip = await getPopulatedTripForNotify(trip._id);

    const payloadCommon = {
      trip: populatedTrip,
      driver: populatedTrip.driverId,
      vehicle: populatedTrip.vehicleId,
      customer: populatedTrip.customerId,
    };

    await createNotification(req, {
      userId: populatedTrip.driverId?._id,
      title: "New Trip Assigned",
      message: `A new delivery has been assigned to you.`,
      type: "assignment",
      category: "driver",
      relatedTripId: populatedTrip._id,
      image: populatedTrip.customerId?.profileImage || null,
      actionUrl: `/driver/trips/${populatedTrip._id}`,
      priority: "high",
      extraData: payloadCommon,
    });

    await createNotification(req, {
      userId: populatedTrip.customerId?._id,
      title: "Driver Assigned",
      message: `A driver has been assigned to your delivery.`,
      type: "status",
      category: "customer",
      relatedTripId: populatedTrip._id,
      image: populatedTrip.driverId?.profileImage || null,
      actionUrl: `/customer/tracking/${populatedTrip._id}`,
      extraData: payloadCommon,
    });

    // 🔁 Realtime broadcast
    await broadcastTripStatus(req, trip._id);

    // 🧾 Activity log — critical event
    await logActivity({
      userId: req.user._id,
      action: "TRIP_ASSIGN",
      description: `Assigned driver ${driverId} and vehicle ${vehicleId} to trip ${tripId}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
      meta: {
        tripId,
        driverId,
        vehicleId,
        companyId,
      },
    });

    res.json({
      ok: true,
      message: "Trip assigned successfully",
      trip,
    });
  } catch (err) {
    console.error("❌ Assign trip error:", err.message);
    res.status(500).json({
      error: "Server error assigning driver/vehicle",
    });
  }
};

/* ==========================================================
   ✅ 3. Complete Trip (Auto Payment & Free Vehicle)
   ========================================================== */
export const completeTrip = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    const { tripId, totalDistance } = req.body;

    if (!tripId) {
      return res.status(400).json({ error: "Missing tripId" });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    trip.status = "delivered";
    trip.endTime = new Date();
    trip.totalDistance = totalDistance || trip.totalDistance;
    trip.paymentStatus = "paid";
    trip.customerConfirmed = true;
    trip.confirmationTime = new Date();
    await trip.save();

    // Free vehicle
    await Vehicle.findByIdAndUpdate(trip.vehicleId, {
      status: "available",
      driverId: null,
    });

    // 🔐 Auto payment creation with commission breakdown (10E)
    const existingPayment = await Payment.findOne({ tripId });
    if (!existingPayment) {
      // 1) Load company billing settings from User (role: company)
      const companyUser = await User.findById(trip.companyId).select(
        "commissionDeliveryPercentage commissionProductPercentage enableProductCommission enableProductSales"
      );

      // 2) Base amounts from trip
      const deliveryFee = trip.deliveryFee || 0;
      const productTotal = Array.isArray(trip.orderItems)
        ? trip.orderItems.reduce(
            (sum, item) => sum + (item.subtotal || 0),
            0
          )
        : 0;

      // Customer paid total
      const rawBase =
        (companyUser?.enableProductSales ? productTotal : 0) + deliveryFee;

      const discountAmount = 0;
      const taxAmount = 0;
      const gatewayFee = 0;

      const totalAmount =
        rawBase - discountAmount + taxAmount; // no negative

      // 3) Commission rates (with safe defaults)
      const deliveryRate =
        companyUser?.commissionDeliveryPercentage ?? 20;
      const productRate =
        companyUser?.commissionProductPercentage ?? 10;
      const enableProductCommission =
        companyUser?.enableProductCommission ?? false;

      // 4) Commission amounts
      const companyDeliveryCommissionAmount =
        (deliveryFee * deliveryRate) / 100;

      const companyProductCommissionAmount = enableProductCommission
        ? (productTotal * productRate) / 100
        : 0;

      const companyEarning =
        companyDeliveryCommissionAmount + companyProductCommissionAmount;

      // For now, platform commission is 0 from this flow
      const platformEarning = 0;

      // Driver gets the rest
      const driverEarning =
        totalAmount - companyEarning - platformEarning - gatewayFee;

      await Payment.create({
        tripId,
        companyId: trip.companyId,
        driverId: trip.driverId,
        customerId: trip.customerId,

        totalAmount,
        deliveryFee,
        productTotal,
        discountAmount,
        taxAmount,
        gatewayFee,

        driverEarning: Math.max(driverEarning, 0),
        companyEarning: Math.max(companyEarning, 0),
        platformEarning: Math.max(platformEarning, 0),

        method: "cod",
        status: "paid",
        paidAt: new Date(),
        createdBy: req.user._id,
      });
    }

    // 🔔 Notifications
    const populatedTrip = await getPopulatedTripForNotify(trip._id);
    const payloadCommon = {
      trip: populatedTrip,
      driver: populatedTrip.driverId,
      vehicle: populatedTrip.vehicleId,
      customer: populatedTrip.customerId,
    };

    await createNotification(req, {
      userId: populatedTrip.customerId?._id,
      title: "Delivery Completed",
      message: "Your delivery has been completed successfully.",
      type: "status",
      category: "customer",
      relatedTripId: populatedTrip._id,
      image: populatedTrip.driverId?.profileImage || null,
      actionUrl: `/customer/tracking/${populatedTrip._id}`,
      extraData: payloadCommon,
    });

    // 🔁 Realtime broadcast
    await broadcastTripStatus(req, trip._id);

    // 🧾 Activity log — critical event
    await logActivity({
      userId: req.user._id,
      action: "TRIP_COMPLETE",
      description: `Completed trip ${trip._id} for customer ${trip.customerId}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
      meta: {
        tripId: trip._id,
        driverId: trip.driverId,
        vehicleId: trip.vehicleId,
        companyId: trip.companyId,
        totalDistance: trip.totalDistance,
      },
    });

    res.json({
      ok: true,
      message: "Trip completed successfully",
      trip,
    });
  } catch (err) {
    console.error("❌ Trip complete error:", err.message);
    res.status(500).json({
      error: "Server error completing trip",
    });
  }
};

/* ==========================================================
   📦 6. List all Trips (Company / Manager / Owner / Superadmin)
   ========================================================== */
export const listTrips = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    const filter = {};

    if (req.user.role === "company") {
      filter.companyId = req.user._id;
    } else if (req.user.role === "manager") {
      filter.companyId = req.user.companyId;
    } else if (req.user.role === "owner" || req.user.role === "superadmin") {
      if (req.query.companyId) {
        filter.companyId = req.query.companyId;
      }
    }

    const trips = await Trip.find(filter)
      .populate("driverId", "name email profileImage")
      .populate("vehicleId", "type brand model plateNumber status")
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      total: trips.length,
      trips,
    });
  } catch (err) {
    console.error("❌ Error fetching trip list:", err.message);
    res.status(500).json({
      error: "Server error fetching trip list",
    });
  }
};

/* ==========================================================
   📦 Filtered Orders (Manager / Company / Owner / Superadmin)
   ========================================================== */
export const managerSearchTrips = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    const {
      status,
      driverId,
      vehicleId,
      customerId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      companyId: queryCompanyId,
    } = req.query;

    const filter = {};

    if (req.user.role === "company") {
      filter.companyId = req.user._id;
    } else if (req.user.role === "manager") {
      filter.companyId = req.user.companyId;
    } else if (req.user.role === "owner" || req.user.role === "superadmin") {
      if (queryCompanyId) {
        filter.companyId = queryCompanyId;
      }
    }

    // STATUS
    if (status) filter.status = status;

    // DRIVER / VEHICLE / CUSTOMER
    if (driverId) filter.driverId = driverId;
    if (vehicleId) filter.vehicleId = vehicleId;
    if (customerId) filter.customerId = customerId;

    // DATE RANGE
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // TEXT SEARCH
    if (search) {
      filter.$or = [
        {
          "pickupLocation.address": {
            $regex: search,
            $options: "i",
          },
        },
        {
          "dropoffLocation.address": {
            $regex: search,
            $options: "i",
          },
        },
        { customerNotes: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
        { _id: { $regex: search, $options: "i" } },
      ];
    }

    // PAGINATION
    const skip = (page - 1) * limit;

    const [total, trips] = await Promise.all([
      Trip.countDocuments(filter),
      Trip.find(filter)
        .populate("driverId", "name email profileImage")
        .populate("vehicleId", "brand model plateNumber")
        .populate("customerId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
    ]);

    res.json({
      ok: true,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      trips,
    });
  } catch (err) {
    console.error("❌ Manager search error:", err.message);
    res.status(500).json({ error: "Server error searching orders" });
  }
};

/* ==========================================================
   6D — Cancel a Trip (Manager / Company / Owner / Superadmin)
   ========================================================== */
export const cancelTrip = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    const { tripId } = req.params;
    const { reason, companyId: bodyCompanyId } = req.body;

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({
        error: "A valid cancellation reason is required",
      });
    }

    let trip;

    if (req.user.role === "company") {
      trip = await Trip.findOne({ _id: tripId, companyId: req.user._id });
    } else if (req.user.role === "manager") {
      trip = await Trip.findOne({
        _id: tripId,
        companyId: req.user.companyId,
      });
    } else if (req.user.role === "owner" || req.user.role === "superadmin") {
      if (bodyCompanyId) {
        trip = await Trip.findOne({
          _id: tripId,
          companyId: bodyCompanyId,
        });
      } else {
        trip = await Trip.findById(tripId);
      }
    }

    if (!trip) {
      return res.status(404).json({
        error: "Trip not found for your scope",
      });
    }

    if (["delivered", "cancelled"].includes(trip.status)) {
      return res.status(400).json({
        error: `Trip cannot be cancelled. Current status: ${trip.status}`,
      });
    }

    trip.status = "cancelled";
    trip.cancelReason = reason;
    trip.cancelledAt = new Date();

    await trip.save();

    // Free vehicle if assigned
    if (trip.vehicleId) {
      await Vehicle.findByIdAndUpdate(trip.vehicleId, {
        status: "available",
        driverId: null,
      });
    }

    // 🔔 Notifications
    const populatedTrip = await getPopulatedTripForNotify(trip._id);
    const payloadCommon = {
      trip: populatedTrip,
      driver: populatedTrip.driverId,
      vehicle: populatedTrip.vehicleId,
      customer: populatedTrip.customerId,
    };

    if (populatedTrip.driverId?._id) {
      await createNotification(req, {
        userId: populatedTrip.driverId._id,
        title: "Trip Cancelled",
        message: `Your assigned trip was cancelled: ${reason}`,
        type: "status",
        category: "driver",
        relatedTripId: populatedTrip._id,
        actionUrl: `/driver/trips/${populatedTrip._id}`,
        extraData: payloadCommon,
      });
    }

    if (populatedTrip.customerId?._id) {
      await createNotification(req, {
        userId: populatedTrip.customerId._id,
        title: "Your Delivery Was Cancelled",
        message: `Your delivery was cancelled: ${reason}`,
        type: "status",
        category: "customer",
        relatedTripId: populatedTrip._id,
        actionUrl: `/customer/tracking/${populatedTrip._id}`,
        extraData: payloadCommon,
      });
    }

    // 🔁 Realtime broadcast
    await broadcastTripStatus(req, trip._id);

    // 🧾 Activity log — critical event
    await logActivity({
      userId: req.user._id,
      action: "TRIP_CANCEL",
      description: `Cancelled trip ${trip._id} — reason: ${reason}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
      meta: {
        tripId: trip._id,
        companyId: trip.companyId,
        driverId: trip.driverId,
        customerId: trip.customerId,
      },
    });

    res.json({
      ok: true,
      message: "Trip cancelled successfully",
      trip,
    });
  } catch (err) {
    console.error("❌ Trip cancel error:", err.message);
    res.status(500).json({
      error: "Server error cancelling trip",
    });
  }
};

/* ==========================================================
   6E — Update Trip (Manager / Company / Owner / Superadmin)
   ========================================================== */
export const updateTrip = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    const { tripId } = req.params;
    const {
      driverId,
      vehicleId,
      deliveryFee,
      pickupLocation,
      dropoffLocation,
      companyId: bodyCompanyId,
    } = req.body;

    let trip;

    if (req.user.role === "company") {
      trip = await Trip.findOne({
        _id: tripId,
        companyId: req.user._id,
      });
    } else if (req.user.role === "manager") {
      trip = await Trip.findOne({
        _id: tripId,
        companyId: req.user.companyId,
      });
    } else if (req.user.role === "owner" || req.user.role === "superadmin") {
      if (bodyCompanyId) {
        trip = await Trip.findOne({
          _id: tripId,
          companyId: bodyCompanyId,
        });
      } else {
        trip = await Trip.findById(tripId);
      }
    }

    if (!trip)
      return res
        .status(404)
        .json({ error: "Trip not found in your scope" });

    if (["delivered", "cancelled"].includes(trip.status)) {
      return res.status(400).json({
        error: `Cannot update trip with status '${trip.status}'.`,
      });
    }

    const companyId = trip.companyId;

    // DRIVER validation (optional)
    if (driverId && driverId !== String(trip.driverId)) {
      const driver = await User.findOne({
        _id: driverId,
        role: "driver",
        companyId,
      });

      if (!driver)
        return res.status(400).json({
          error: "Driver not found or not part of this company",
        });

      const activeTrip = await Trip.findOne({
        driverId,
        status: { $in: ["assigned", "in_progress"] },
        _id: { $ne: tripId },
      });

      if (activeTrip) {
        return res.status(400).json({
          error: "This driver is already busy with another trip.",
        });
      }

      trip.driverId = driverId;
    }

    // VEHICLE validation (optional)
    if (vehicleId && vehicleId !== String(trip.vehicleId)) {
      const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId });

      if (!vehicle)
        return res.status(400).json({
          error: "Vehicle not found or not part of this company",
        });

      if (vehicle.status === "maintenance") {
        return res.status(400).json({
          error: "Vehicle is under maintenance.",
        });
      }

      const busyVehicle = await Trip.findOne({
        vehicleId,
        status: { $in: ["assigned", "in_progress"] },
        _id: { $ne: tripId },
      });

      if (busyVehicle) {
        return res.status(400).json({
          error: "This vehicle is already in use.",
        });
      }

      trip.vehicleId = vehicleId;
    }

    // Update fee (optional)
    if (typeof deliveryFee === "number" && deliveryFee >= 0) {
      trip.deliveryFee = deliveryFee;
    }

    // Update pickup/dropoff (optional)
    if (pickupLocation) {
      trip.pickupLocation = {
        address: pickupLocation.address || trip.pickupLocation.address,
        lat: pickupLocation.lat ?? trip.pickupLocation.lat,
        lng: pickupLocation.lng ?? trip.pickupLocation.lng,
      };
    }

    if (dropoffLocation) {
      trip.dropoffLocation = {
        address: dropoffLocation.address || trip.dropoffLocation.address,
        lat: dropoffLocation.lat ?? trip.dropoffLocation.lat,
        lng: dropoffLocation.lng ?? trip.dropoffLocation.lng,
      };
    }

    await trip.save();

    // 🔔 Notifications
    const populatedTrip = await getPopulatedTripForNotify(trip._id);
    const payloadCommon = {
      trip: populatedTrip,
      driver: populatedTrip.driverId,
      vehicle: populatedTrip.vehicleId,
      customer: populatedTrip.customerId,
    };

    if (populatedTrip.driverId?._id) {
      await createNotification(req, {
        userId: populatedTrip.driverId._id,
        title: "Trip Updated",
        message: "Your assigned trip details have been updated.",
        type: "update",
        category: "driver",
        relatedTripId: populatedTrip._id,
        actionUrl: `/driver/trips/${populatedTrip._id}`,
        extraData: payloadCommon,
      });
    }

    if (populatedTrip.customerId?._id) {
      await createNotification(req, {
        userId: populatedTrip.customerId._id,
        title: "Delivery Updated",
        message: "Your delivery details have been updated.",
        type: "update",
        category: "customer",
        relatedTripId: populatedTrip._id,
        actionUrl: `/customer/tracking/${populatedTrip._id}`,
        extraData: payloadCommon,
      });
    }

    // 🔁 Realtime broadcast
    await broadcastTripStatus(req, trip._id);

    // 🧾 Activity log — critical event
    await logActivity({
      userId: req.user._id,
      action: "TRIP_UPDATE",
      description: `Updated trip ${trip._id}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
      meta: {
        tripId: trip._id,
        companyId: trip.companyId,
        driverId: trip.driverId,
        vehicleId: trip.vehicleId,
      },
    });

    res.json({
      ok: true,
      message: "Trip updated successfully",
      trip,
    });
  } catch (err) {
    console.error("❌ Trip update error:", err.message);
    res.status(500).json({ error: "Server error updating trip" });
  }
};
