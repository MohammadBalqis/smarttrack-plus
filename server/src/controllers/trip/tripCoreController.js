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
import { resolveCompanyId } from "../../utils/resolveCompanyId.js";

/* ==========================================================
   Helper — Maintenance Mode (superadmin bypass)
========================================================== */
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
   Helper — Notify Managers / Company Owner
========================================================== */
const notifyCompanyManagers = async (
  req,
  companyId,
  notificationProps,
  extraData = {}
) => {
  if (!companyId) return;

  const managers = await User.find({ role: "manager", companyId }).select("_id");

  const targets = managers.length ? managers : [{ _id: companyId }];

  await Promise.all(
    targets.map((m) =>
      createNotification(req, {
        userId: m._id,
        category: notificationProps.category || "company",
        ...notificationProps,
        extraData: notificationProps.extraData || extraData,
      })
    )
  );
};

/* ==========================================================
   1) CREATE TRIP
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
      companyId: bodyCompanyId,
    } = req.body;

    if (!driverId || !vehicleId || !customerId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let companyId = resolveCompanyId(req.user) || bodyCompanyId;
    if (!companyId) {
      return res.status(400).json({
        error:
          "companyId is required in body when creating a trip as superadmin/owner.",
      });
    }

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

    vehicle.status = "in_use";
    vehicle.driverId = driverId;
    await vehicle.save();

    const populatedTrip = await getPopulatedTripForNotify(trip._id);

    const payloadCommon = {
      trip: populatedTrip,
      driver: populatedTrip.driverId,
      vehicle: populatedTrip.vehicleId,
      customer: populatedTrip.customerId,
    };

    // Driver notification
    await createNotification(req, {
      userId: populatedTrip.driverId?._id,
      title: "New Trip Assigned",
      message: "A new delivery has been assigned to you.",
      type: "assignment",
      category: "driver",
      relatedTripId: populatedTrip._id,
      image: populatedTrip.customerId?.profileImage || null,
      actionUrl: `/driver/trips/${populatedTrip._id}`,
      priority: "high",
      extraData: payloadCommon,
    });

    // Customer notification
    await createNotification(req, {
      userId: populatedTrip.customerId?._id,
      title: "Your Delivery Is On The Way",
      message: "Your order has been confirmed and a driver was assigned.",
      type: "status",
      category: "customer",
      relatedTripId: populatedTrip._id,
      image: populatedTrip.driverId?.profileImage || null,
      actionUrl: `/customer/tracking/${populatedTrip._id}`,
      extraData: payloadCommon,
    });

    // Company notifications
    await notifyCompanyManagers(
      req,
      companyId,
      {
        title: "New Trip Created",
        message: `A new trip was created for customer ${
          populatedTrip.customerId?.name || ""
        }`,
        category: "company",
        type: "status",
        relatedTripId: populatedTrip._id,
        actionUrl: `/company/trips/${populatedTrip._id}`,
      },
      payloadCommon
    );

    await broadcastTripStatus(req, trip._id);

    await logActivity({
      userId: req.user._id,
      action: "TRIP_CREATE",
      description: `Created trip ${trip._id}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
      meta: { tripId: trip._id, driverId, vehicleId, customerId, companyId },
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
   REQUIRED EXPORTS FOR ROUTER
   (Empty placeholders for now)
========================================================== */

export const assignTrip = async () => {};
export const completeTrip = async () => {};
export const listTrips = async () => {};
export const managerSearchTrips = async () => {};
export const cancelTrip = async () => {};
export const updateTrip = async () => {};
