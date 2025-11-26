// server/src/controllers/companyVehicleController.js
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import Trip from "../models/Trip.js";



// 🔔 Notification helpers
import {
  createNotification,
  getPopulatedTripForNotify,
  broadcastTripStatus,
} from "../controllers/trip/tripHelpers.js";

/* Helper: notify managers + fallback to company owner */
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
        category: "company",
        ...notificationProps,
        extraData,
      })
    )
  );
};

/* Resolve companyId depending on role */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role))
    return user.companyId;
  return null;
};

/* ==========================================================
   🚘 GET ALL VEHICLES FOR COMPANY (Manager + Company)
========================================================== */
export const getCompanyVehicles = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { type, status, driverId, plate } = req.query;

    let filters = { companyId };

    if (type) filters.type = type;
    if (status) filters.status = status;
    if (driverId) filters.driverId = driverId;
    if (plate) {
      filters.plateNumber = { $regex: plate, $options: "i" };
    }

    const vehicles = await Vehicle.find(filters)
      .populate("driverId", "name email phoneNumber")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (err) {
    console.error("❌ Error fetching vehicles:", err.message);
    res.status(500).json({ error: "Server error fetching vehicles" });
  }
};

/* ==========================================================
   🛠 UPDATE VEHICLE (status / driver / plate / notes / image)
   with FULL NOTIFICATION SUPPORT
========================================================== */
export const updateCompanyVehicle = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const vehicle = await Vehicle.findOne({ _id: id, companyId });

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    const previousStatus = vehicle.status;
    const previousDriverId = vehicle.driverId;

    const {
      status,
      driverId,
      plateNumber,
      notes,
      vehicleImage,
      brand,
      model,
    } = req.body;

    if (status) vehicle.status = status;
    if (driverId !== undefined) vehicle.driverId = driverId || null;
    if (plateNumber) vehicle.plateNumber = plateNumber;
    if (notes !== undefined) vehicle.notes = notes;
    if (vehicleImage !== undefined) vehicle.vehicleImage = vehicleImage;
    if (brand) vehicle.brand = brand;
    if (model) vehicle.model = model;

    await vehicle.save();

    /* 🔔 OPTIONAL NOTIFICATIONS */

    const extraData = { vehicle };

    // 1️⃣ Vehicle status changed
    if (status && status !== previousStatus) {
      await notifyCompanyManagers(req, companyId, {
        title: "Vehicle Status Changed",
        message: `Vehicle ${vehicle.plateNumber} status changed to "${status}".`,
        type: "status",
        relatedVehicleId: vehicle._id,
        actionUrl: `/company/vehicles/${vehicle._id}`,
      }, extraData);
    }

    // 2️⃣ Driver assigned/unassigned to vehicle
    if (driverId !== undefined && driverId !== String(previousDriverId)) {
      if (driverId) {
        // assigned
        await createNotification(req, {
          userId: driverId,
          title: "Vehicle Assigned",
          message: `A vehicle has been assigned to you.`,
          type: "assignment",
          category: "driver",
          relatedVehicleId: vehicle._id,
          actionUrl: `/driver/vehicle/${vehicle._id}`,
          extraData,
        });

        await notifyCompanyManagers(req, companyId, {
          title: "Driver Assigned to Vehicle",
          message: `Driver was assigned to vehicle ${vehicle.plateNumber}.`,
          type: "status",
          relatedVehicleId: vehicle._id,
        }, extraData);
      } else {
        // unassigned
        await notifyCompanyManagers(req, companyId, {
          title: "Driver Removed From Vehicle",
          message: `Vehicle ${vehicle.plateNumber} is now driver-free.`,
          type: "status",
          relatedVehicleId: vehicle._id,
        }, extraData);
      }
    }

    res.json({
      ok: true,
      message: "Vehicle updated successfully",
      vehicle,
    });
  } catch (err) {
    console.error("❌ updateCompanyVehicle error:", err.message);
    res.status(500).json({ error: "Server error updating vehicle" });
  }
};
