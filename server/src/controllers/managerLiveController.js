// server/src/controllers/managerLiveController.js
import User from "../models/User.js";
import Trip from "../models/Trip.js";

/* ==========================================================
   Helper: resolve companyId
========================================================== */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (user.role === "manager") return user.companyId;
  return null;
};

/* ==========================================================
   🚚 GET LIVE DRIVERS (company / manager)
   - Only drivers with last known location
   - Filter by optional status (?status=available,in_progress)
========================================================== */
export const getManagerLiveDrivers = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ ok: false, error: "Unable to resolve companyId" });
    }

    const { status } = req.query; // e.g. available,in_progress

    const filter = {
      role: "driver",
      companyId,
      currentLat: { $ne: null },
      currentLng: { $ne: null },
    };

    if (status) {
      const statuses = status.split(",").map((s) => s.trim());
      filter.driverStatus = { $in: statuses };
    }

    const drivers = await User.find(filter)
      .select(
        "name email phone profileImage driverStatus currentLat currentLng totalTripsCompleted performanceScore shopId"
      )
      .populate("shopId", "name city");

    res.json({
      ok: true,
      count: drivers.length,
      drivers: drivers.map((d) => ({
        id: d._id,
        name: d.name,
        email: d.email,
        phone: d.phone || "",
        avatar: d.profileImage || null,
        status: d.driverStatus,
        lat: d.currentLat,
        lng: d.currentLng,
        totalTripsCompleted: d.totalTripsCompleted || 0,
        performanceScore: d.performanceScore || 0,
        shop: d.shopId
          ? {
              id: d.shopId._id,
              name: d.shopId.name,
              city: d.shopId.city,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error("❌ getManagerLiveDrivers error:", err.message);
    res.status(500).json({ ok: false, error: "Server error fetching live drivers" });
  }
};

/* ==========================================================
   📦 GET LIVE TRIPS (Active)
   - status in: assigned, in_progress
   - With driver + vehicle + customer
========================================================== */
export const getManagerLiveTrips = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ ok: false, error: "Unable to resolve companyId" });
    }

    const { shopId } = req.query; // optional filter by shop

    const filter = {
      companyId,
      status: { $in: ["assigned", "in_progress"] },
    };

    if (shopId) {
      filter.shopId = shopId;
    }

    const trips = await Trip.find(filter)
      .sort({ createdAt: -1 })
      .populate("driverId", "name profileImage phone currentLat currentLng driverStatus")
      .populate("customerId", "name phone")
      .populate("vehicleId", "brand model plateNumber type vehicleImage")
      .populate("shopId", "name city address");

    res.json({
      ok: true,
      count: trips.length,
      trips: trips.map((t) => ({
        id: t._id,
        status: t.status,
        createdAt: t.createdAt,
        pickup: t.pickupLocation,
        dropoff: t.dropoffLocation,
        deliveryFee: t.deliveryFee || 0,
        totalAmount: t.totalAmount || 0,
        driver: t.driverId
          ? {
              id: t.driverId._id,
              name: t.driverId.name,
              phone: t.driverId.phone || "",
              avatar: t.driverId.profileImage || null,
              status: t.driverId.driverStatus,
              lat: t.driverId.currentLat,
              lng: t.driverId.currentLng,
            }
          : null,
        customer: t.customerId
          ? {
              id: t.customerId._id,
              name: t.customerId.name,
              phone: t.customerId.phone || "",
            }
          : null,
        vehicle: t.vehicleId
          ? {
              id: t.vehicleId._id,
              brand: t.vehicleId.brand,
              model: t.vehicleId.model,
              plateNumber: t.vehicleId.plateNumber,
              type: t.vehicleId.type,
              image: t.vehicleId.vehicleImage || null,
            }
          : null,
        shop: t.shopId
          ? {
              id: t.shopId._id,
              name: t.shopId.name,
              city: t.shopId.city,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error("❌ getManagerLiveTrips error:", err.message);
    res.status(500).json({ ok: false, error: "Server error fetching live trips" });
  }
};
