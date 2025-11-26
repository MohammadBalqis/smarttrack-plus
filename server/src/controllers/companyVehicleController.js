// server/src/controllers/companyVehicleController.js
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import Trip from "../models/Trip.js";

/* ==========================================================
   Helper: resolve companyId from logged-in user
========================================================== */
const resolveCompanyIdFromUser = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role)) {
    return user.companyId;
  }
  return null;
};

/* ==========================================================
   🚗 GET ALL VEHICLES (Company + Manager)
   GET /api/company/vehicles
   Query filters: ?type=&status=&driverId=&plate=
========================================================== */
export const getCompanyVehicles = async (req, res) => {
  try {
    const companyId = resolveCompanyIdFromUser(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { type, status, driverId, plate } = req.query;

    const query = { companyId };

    if (type) query.type = type;
    if (status) query.status = status;                // "available", "in_use", "maintenance"
    if (driverId) query.driverId = driverId;
    if (plate) query.plateNumber = new RegExp(plate, "i");

    const vehicles = await Vehicle.find(query)
      .populate("driverId", "name email phone profileImage role")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ok: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (err) {
    console.error("❌ getCompanyVehicles error:", err.message);
    res.status(500).json({ error: "Error fetching vehicles" });
  }
};

/* ==========================================================
   ➕ CREATE VEHICLE (Company ONLY)
   POST /api/company/vehicles
========================================================== */
export const createCompanyVehicle = async (req, res) => {
  try {
    if (req.user.role !== "company") {
      return res.status(403).json({ error: "Only company owner can create vehicles" });
    }

    const companyId = resolveCompanyIdFromUser(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { type, brand, model, plateNumber, notes, vehicleImage } = req.body;

    if (!type || !brand || !model || !plateNumber) {
      return res.status(400).json({ error: "Type, brand, model and plate are required" });
    }

    // Unique plate per company
    const exists = await Vehicle.findOne({ companyId, plateNumber });
    if (exists) {
      return res.status(400).json({ error: "This plate number already exists in your company" });
    }

    const vehicle = await Vehicle.create({
      type,
      brand,
      model,
      plateNumber,
      notes: notes || "",
      vehicleImage: vehicleImage || null,
      companyId,
      status: "available",
    });

    res.status(201).json({
      ok: true,
      message: "Vehicle created successfully",
      vehicle,
    });
  } catch (err) {
    console.error("❌ createCompanyVehicle error:", err.message);
    res.status(500).json({ error: "Error creating vehicle" });
  }
};

/* ==========================================================
   ✏ UPDATE VEHICLE BASIC INFO (Company ONLY)
   PUT /api/company/vehicles/:id
========================================================== */
export const updateCompanyVehicle = async (req, res) => {
  try {
    if (req.user.role !== "company") {
      return res.status(403).json({ error: "Only company owner can update vehicles" });
    }

    const companyId = resolveCompanyIdFromUser(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { id } = req.params;
    const { type, brand, model, plateNumber, notes, vehicleImage } = req.body;

    const vehicle = await Vehicle.findOne({ _id: id, companyId });
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    if (plateNumber && plateNumber !== vehicle.plateNumber) {
      const exists = await Vehicle.findOne({ companyId, plateNumber });
      if (exists) {
        return res.status(400).json({ error: "Another vehicle already uses this plate" });
      }
      vehicle.plateNumber = plateNumber;
    }

    if (type) vehicle.type = type;
    if (brand) vehicle.brand = brand;
    if (model) vehicle.model = model;
    if (notes !== undefined) vehicle.notes = notes;
    if (vehicleImage !== undefined) vehicle.vehicleImage = vehicleImage;

    await vehicle.save();

    res.json({
      ok: true,
      message: "Vehicle updated successfully",
      vehicle,
    });
  } catch (err) {
    console.error("❌ updateCompanyVehicle error:", err.message);
    res.status(500).json({ error: "Error updating vehicle" });
  }
};

/* ==========================================================
   👨‍🔧 ASSIGN / REMOVE DRIVER (Company + Manager)
   PUT /api/company/vehicles/:id/assign-driver
========================================================== */
export const assignCompanyVehicleDriver = async (req, res) => {
  try {
    const companyId = resolveCompanyIdFromUser(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { id } = req.params;
    const { driverId } = req.body;

    const vehicle = await Vehicle.findOne({ _id: id, companyId });
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    // Remove driver
    if (!driverId) {
      vehicle.driverId = null;
      vehicle.status = "available";
      await vehicle.save();

      return res.json({
        ok: true,
        message: "Driver removed from vehicle",
        vehicle,
      });
    }

    // Assign driver
    const driver = await User.findOne({
      _id: driverId,
      companyId,
      role: "driver",
    });

    if (!driver) {
      return res
        .status(400)
        .json({ error: "Driver not found or not part of your company" });
    }

    vehicle.driverId = driverId;
    vehicle.status = "in_use";
    await vehicle.save();

    res.json({
      ok: true,
      message: "Driver assigned successfully",
      vehicle,
    });
  } catch (err) {
    console.error("❌ assignCompanyVehicleDriver error:", err.message);
    res.status(500).json({ error: "Error assigning driver" });
  }
};

/* ==========================================================
   🔄 UPDATE VEHICLE STATUS (Company + Manager)
   PUT /api/company/vehicles/:id/status
========================================================== */
export const updateCompanyVehicleStatus = async (req, res) => {
  try {
    const companyId = resolveCompanyIdFromUser(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["available", "in_use", "maintenance"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const vehicle = await Vehicle.findOne({ _id: id, companyId });
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    if (vehicle.driverId && status === "available") {
      return res.status(400).json({
        error: "Cannot mark as available while a driver is assigned",
      });
    }

    vehicle.status = status;
    await vehicle.save();

    res.json({
      ok: true,
      message: "Status updated successfully",
      vehicle,
    });
  } catch (err) {
    console.error("❌ updateCompanyVehicleStatus error:", err.message);
    res.status(500).json({ error: "Error updating vehicle status" });
  }
};

/* ==========================================================
   📜 VEHICLE TRIP HISTORY (Company + Manager)
   GET /api/company/vehicles/:id/trips
========================================================== */
export const getCompanyVehicleTrips = async (req, res) => {
  try {
    const companyId = resolveCompanyIdFromUser(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { id } = req.params;

    const vehicle = await Vehicle.findOne({ _id: id, companyId });
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    const trips = await Trip.find({ vehicleId: id })
      .sort({ createdAt: -1 })
      .populate("driverId", "name")
      .populate("customerId", "name phone")
      .lean();

    res.json({
      ok: true,
      vehicle: {
        brand: vehicle.brand,
        model: vehicle.model,
        plateNumber: vehicle.plateNumber,
      },
      total: trips.length,
      trips,
    });
  } catch (err) {
    console.error("❌ getCompanyVehicleTrips error:", err.message);
    res.status(500).json({ error: "Error fetching vehicle trip history" });
  }
};
