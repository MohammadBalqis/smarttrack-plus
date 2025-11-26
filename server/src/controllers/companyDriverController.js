// server/src/controllers/companyDriverController.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Trip from "../models/Trip.js";



// 🔔 notification helpers
import { createNotification } from "../controllers/trip/tripHelpers.js";

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

const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role)) return user.companyId;
  return null;
};

/* ==========================================================
   📌 GET ALL DRIVERS FOR COMPANY
========================================================== */
export const getCompanyDrivers = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const { status } = req.query;

    const query = { role: "driver", companyId };

    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const drivers = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      count: drivers.length,
      drivers,
    });
  } catch (err) {
    console.error("❌ getCompanyDrivers error:", err.message);
    res.status(500).json({ error: "Server error fetching drivers" });
  }
};

/* ==========================================================
   ➕ CREATE NEW DRIVER (with notification)
========================================================== */
export const createCompanyDriver = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const { name, email, password, phoneNumber } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);

    const driver = await User.create({
      name,
      email,
      passwordHash,
      phoneNumber: phoneNumber || "",
      role: "driver",
      companyId,
      isActive: true,
    });

    const safeDriver = driver.toObject();
    delete safeDriver.passwordHash;

    const extraData = { driver: safeDriver };

    // 🔔 Notify driver
    await createNotification(req, {
      userId: driver._id,
      title: "Welcome!",
      message: "Your driver account has been created.",
      type: "status",
      category: "driver",
      actionUrl: `/driver/dashboard`,
      extraData,
    });

    // 🔔 Notify company managers
    await notifyCompanyManagers(
      req,
      companyId,
      {
        title: "New Driver Added",
        message: `Driver ${driver.name} has joined your company.`,
        type: "status",
        actionUrl: `/company/drivers`,
      },
      extraData
    );

    res.status(201).json({
      ok: true,
      message: "Driver created successfully",
      driver: safeDriver,
    });
  } catch (err) {
    console.error("❌ createCompanyDriver error:", err.message);
    res.status(500).json({ error: "Server error creating driver" });
  }
};

/* ==========================================================
   ✏ UPDATE DRIVER
========================================================== */
export const updateCompanyDriver = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;
    const { name, email, phoneNumber } = req.body;

    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const driver = await User.findOne({ _id: id, role: "driver", companyId });

    if (!driver) return res.status(404).json({ error: "Driver not found" });

    if (email && email !== driver.email) {
      const exists = await User.findOne({ email });
      if (exists)
        return res.status(400).json({ error: "Email already in use" });
      driver.email = email;
    }

    if (name) driver.name = name;
    if (phoneNumber !== undefined) driver.phoneNumber = phoneNumber;

    await driver.save();

    const safeDriver = driver.toObject();
    delete safeDriver.passwordHash;

    // OPTIONAL Notification
    await notifyCompanyManagers(
      req,
      companyId,
      {
        title: "Driver Updated",
        message: `Driver ${driver.name} information was updated.`,
        type: "update",
        actionUrl: `/company/drivers/${driver._id}`,
      },
      { driver: safeDriver }
    );

    res.json({
      ok: true,
      message: "Driver updated successfully",
      driver: safeDriver,
    });
  } catch (err) {
    console.error("❌ updateCompanyDriver error:", err.message);
    res.status(500).json({ error: "Server error updating driver" });
  }
};

/* ==========================================================
   🔁 ACTIVATE / SUSPEND DRIVER
========================================================== */
export const toggleCompanyDriverStatus = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;

    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const driver = await User.findOne({ _id: id, role: "driver", companyId });

    if (!driver) return res.status(404).json({ error: "Driver not found" });

    driver.isActive = !driver.isActive;
    await driver.save();

    const safeDriver = driver.toObject();
    delete safeDriver.passwordHash;

    const extraData = { driver: safeDriver };

    if (!driver.isActive) {
      await createNotification(req, {
        userId: driver._id,
        title: "Account Suspended",
        message: "Your driver account has been suspended.",
        type: "warning",
        category: "driver",
        extraData,
      });

      await notifyCompanyManagers(
        req,
        companyId,
        {
          title: "Driver Suspended",
          message: `Driver ${driver.name} has been suspended.`,
          type: "warning",
        },
        extraData
      );
    } else {
      await createNotification(req, {
        userId: driver._id,
        title: "Account Activated",
        message: "Your driver account is now active again.",
        type: "status",
        category: "driver",
        extraData,
      });

      await notifyCompanyManagers(
        req,
        companyId,
        {
          title: "Driver Activated",
          message: `Driver ${driver.name} is now active.`,
          type: "status",
        },
        extraData
      );
    }

    res.json({
      ok: true,
      message: `Driver is now ${driver.isActive ? "active" : "inactive"}`,
      driver: safeDriver,
    });
  } catch (err) {
    console.error("❌ toggleCompanyDriverStatus error:", err.message);
    res.status(500).json({ error: "Server error updating driver status" });
  }
};

/* ==========================================================
   📊 DRIVER STATS (analytics for one driver)
   GET /api/company/drivers/:id/stats
========================================================== */
export const getCompanyDriverStats = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params; // driverId

    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const driver = await User.findOne({
      _id: id,
      role: "driver",
      companyId,
    }).select("name email profileImage isActive createdAt");

    if (!driver) return res.status(404).json({ error: "Driver not found" });

    const trips = await Trip.find({
      driverId: id,
      status: "delivered",
    }).sort({ createdAt: -1 });

    const totalTrips = trips.length;
    const totalRevenue = trips.reduce(
      (sum, t) => sum + (t.deliveryFee || 0),
      0
    );

    const avgDeliveryTimeMin =
      totalTrips > 0
        ? Math.round(
            trips.reduce((sum, t) => {
              if (!t.startTime || !t.endTime) return sum;
              const start = new Date(t.startTime).getTime();
              const end = new Date(t.endTime).getTime();
              return sum + (end - start) / 60000; // minutes
            }, 0) / totalTrips
          )
        : 0;

    res.json({
      ok: true,
      driver,
      stats: {
        totalTrips,
        totalRevenue,
        avgDeliveryTimeMin,
      },
    });
  } catch (err) {
    console.error("❌ getCompanyDriverStats error:", err.message);
    res.status(500).json({ error: "Server error fetching driver stats" });
  }
};

/* ==========================================================
   🕒 RECENT TRIPS FOR DRIVER
   GET /api/company/drivers/:id/recent-trips
========================================================== */
export const getCompanyDriverRecentTrips = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params; // driverId

    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    // Ensure driver belongs to this company
    const driverExists = await User.exists({
      _id: id,
      role: "driver",
      companyId,
    });

    if (!driverExists)
      return res.status(404).json({ error: "Driver not found" });

    const recentTrips = await Trip.find({
      driverId: id,
      status: "delivered",
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      ok: true,
      count: recentTrips.length,
      recentTrips,
    });
  } catch (err) {
    console.error("❌ getCompanyDriverRecentTrips error:", err.message);
    res.status(500).json({ error: "Server error fetching recent trips" });
  }
};
