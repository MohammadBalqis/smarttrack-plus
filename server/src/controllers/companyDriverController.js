// server/src/controllers/companyDriverController.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Trip from "../models/Trip.js";

// 🔔 notification helpers
import { createNotification } from "../controllers/trip/tripHelpers.js";

/* ==========================================================
   Helpers
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
   📌 GET ALL DRIVERS FOR COMPANY (CLEAN LIST)
   - NO vehicle info here
   - NO verification images here
   - Includes shopId populated (branch)
========================================================== */
export const getCompanyDrivers = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { status } = req.query;

    const query = { role: "driver", companyId };
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const drivers = await User.find(query)
      .select(
        [
          "name",
          "email",
          "phone",
          "phoneNumber",
          "address",
          "profileImage",
          "isActive",
          "createdAt",
          "shopId",
          "driverVerificationStatus",
          "driverOnboardingStage",
        ].join(" ")
      )
      .populate("shopId", "name city")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ok: true,
      count: drivers.length,
      drivers,
    });
  } catch (err) {
    console.error("❌ getCompanyDrivers error:", err);
    res.status(500).json({ error: "Server error fetching drivers" });
  }
};

/* ==========================================================
   ➕ CREATE NEW DRIVER (with notification)
   NOTE:
   - This creates a login-enabled driver (company creates directly)
   - Does NOT create/attach a vehicle (vehicle comes from manager verification flow)
========================================================== */
export const createCompanyDriver = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { name, email, password, phoneNumber, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password required" });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const driver = await User.create({
      name,
      email: String(email).toLowerCase(),
      passwordHash,
      phoneNumber: phoneNumber || "",
      phone: phone || "",
      role: "driver",
      companyId,
      isActive: true,

      // keep consistent with your onboarding system
      driverOnboardingStage: "account_created",
      driverVerificationStatus: "pending",
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
    console.error("❌ createCompanyDriver error:", err);
    res.status(500).json({ error: "Server error creating driver" });
  }
};

/* ==========================================================
   ✏ UPDATE DRIVER (personal info only)
========================================================== */
export const updateCompanyDriver = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;
    const { name, email, phoneNumber, phone, address, profileImage, shopId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const driver = await User.findOne({ _id: id, role: "driver", companyId });
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    if (email && String(email).toLowerCase() !== driver.email) {
      const exists = await User.findOne({ email: String(email).toLowerCase() });
      if (exists) return res.status(400).json({ error: "Email already in use" });
      driver.email = String(email).toLowerCase();
    }

    if (name) driver.name = name;
    if (phoneNumber !== undefined) driver.phoneNumber = phoneNumber;
    if (phone !== undefined) driver.phone = phone;
    if (address !== undefined) driver.address = address;
    if (profileImage !== undefined) driver.profileImage = profileImage;
    if (shopId !== undefined) driver.shopId = shopId || null;

    await driver.save();

    const safeDriver = driver.toObject();
    delete safeDriver.passwordHash;

    await notifyCompanyManagers(
      req,
      companyId,
      {
        title: "Driver Updated",
        message: `Driver ${driver.name} information was updated.`,
        type: "update",
        actionUrl: `/company/drivers`,
      },
      { driver: safeDriver }
    );

    res.json({
      ok: true,
      message: "Driver updated successfully",
      driver: safeDriver,
    });
  } catch (err) {
    console.error("❌ updateCompanyDriver error:", err);
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

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

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
    console.error("❌ toggleCompanyDriverStatus error:", err);
    res.status(500).json({ error: "Server error updating driver status" });
  }
};

/* ==========================================================
   📊 DRIVER STATS (analytics for one driver)
========================================================== */
export const getCompanyDriverStats = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const driver = await User.findOne({
      _id: id,
      role: "driver",
      companyId,
    })
      .select(
        "name email profileImage isActive createdAt driverStatus driverVerificationStatus driverOnboardingStage shopId"
      )
      .populate("shopId", "name city");

    if (!driver) return res.status(404).json({ error: "Driver not found" });

    const trips = await Trip.find({
      driverId: id,
      status: "delivered",
    }).sort({ createdAt: -1 });

    const totalTrips = trips.length;
    const totalRevenue = trips.reduce((sum, t) => sum + (t.deliveryFee || 0), 0);

    const avgDeliveryTimeMin =
      totalTrips > 0
        ? Math.round(
            trips.reduce((sum, t) => {
              if (!t.startTime || !t.endTime) return sum;
              const start = new Date(t.startTime).getTime();
              const end = new Date(t.endTime).getTime();
              return sum + (end - start) / 60000;
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
    console.error("❌ getCompanyDriverStats error:", err);
    res.status(500).json({ error: "Server error fetching driver stats" });
  }
};

/* ==========================================================
   🕒 RECENT TRIPS FOR DRIVER
========================================================== */
export const getCompanyDriverRecentTrips = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const driverExists = await User.exists({
      _id: id,
      role: "driver",
      companyId,
    });

    if (!driverExists) {
      return res.status(404).json({ error: "Driver not found" });
    }

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
    console.error("❌ getCompanyDriverRecentTrips error:", err);
    res.status(500).json({ error: "Server error fetching recent trips" });
  }
};
