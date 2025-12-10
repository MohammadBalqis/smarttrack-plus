// server/src/controllers/trip/tripCoreController.js
import Trip from "../../models/Trip.js";
import Vehicle from "../../models/Vehicle.js";
import Payment from "../../models/Payment.js";
import User from "../../models/User.js";
import GlobalSettings from "../../models/GlobalSettings.js";
import { logActivity } from "../../utils/activityLogger.js";
import {
  getPopulatedTripForNotify,
  broadcastTripStatus,
} from "./tripHelpers.js";
import { resolveCompanyId } from "../../utils/resolveCompanyId.js";

// 🔔 NEW notification helpers
import {
  notifyDriver,
  notifyCustomer,
  notifyShopManagers,
  notifyAllManagersInCompany,
} from "../../utils/notify.js";
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
      shopId: bodyShopId, // optional, if you already pass shopId
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

    // Optional: if trip belongs to a shop
    const tripShopId = bodyShopId || driver.shopId || null;

    const trip = await Trip.create({
      driverId,
      vehicleId,
      customerId,
      companyId,
      shopId: tripShopId || undefined,
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
      shopId: populatedTrip.shopId || tripShopId || null,
    };

    /* --------------------------------------------------
       🔔 Driver notification
    -------------------------------------------------- */
    if (populatedTrip.driverId?._id) {
      await notifyDriver(req, populatedTrip.driverId._id, {
        title: "New Trip Assigned",
        message: "A new delivery has been assigned to you.",
        type: "trip",
        priority: "high",
        actionUrl: `/driver/trips/${populatedTrip._id}`,
        relatedTripId: populatedTrip._id,
        meta: payloadCommon,
      });
    }

    /* --------------------------------------------------
       🔔 Customer notification
    -------------------------------------------------- */
    if (populatedTrip.customerId?._id) {
      await notifyCustomer(req, populatedTrip.customerId._id, {
        title: "Your delivery is on the way",
        message: "Your order has been confirmed and a driver was assigned.",
        type: "trip",
        priority: "normal",
        actionUrl: `/customer/tracking/${populatedTrip._id}`,
        relatedTripId: populatedTrip._id,
        meta: payloadCommon,
      });
    }

    /* --------------------------------------------------
       🔔 Managers / Company notifications
       - If we know shopId → only that shop's managers
       - Else → all managers in the company
    -------------------------------------------------- */
    const finalShopId =
      populatedTrip.shopId?._id || populatedTrip.shopId || tripShopId || null;

    if (finalShopId) {
      await notifyShopManagers(req, companyId, finalShopId, {
        title: "New Trip in Your Shop",
        message: `New trip created for customer ${
          populatedTrip.customerId?.name || ""
        }.`,
        type: "trip",
        priority: "normal",
        actionUrl: `/manager/trips/${populatedTrip._id}`,
        relatedTripId: populatedTrip._id,
        meta: payloadCommon,
      });
    } else {
      await notifyAllManagersInCompany(req, companyId, {
        title: "New Trip Created",
        message: `A new trip was created for customer ${
          populatedTrip.customerId?.name || ""
        }.`,
        type: "trip",
        priority: "normal",
        actionUrl: `/company/trips/${populatedTrip._id}`,
        relatedTripId: populatedTrip._id,
        meta: payloadCommon,
      });
    }

    // 🔄 Broadcast for live map / sockets
    await broadcastTripStatus(req, trip._id);

    // 📝 Activity log
    await logActivity({
      userId: req.user._id,
      action: "TRIP_CREATE",
      description: `Created trip ${trip._id}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
      meta: {
        tripId: trip._id,
        driverId,
        vehicleId,
        customerId,
        companyId,
        shopId: finalShopId || null,
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
   REQUIRED EXPORTS FOR ROUTER
   (You can fill these later)
========================================================== */

export const assignTrip = async () => {};
export const completeTrip = async () => {};
export const listTrips = async () => {};
export const managerSearchTrips = async () => {};
export const cancelTrip = async () => {};
export const updateTrip = async () => {};
