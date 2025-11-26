// server/src/controllers/managerDriversController.js
import User from "../models/User.js";

import { resolveCompanyId } from "../utils/resolveCompanyId.js";


/* ==========================================================
   📌 GET ALL DRIVERS FOR MANAGER
========================================================== */
export const getManagerDrivers = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const { status } = req.query; // active|inactive

    const filters = { role: "driver", companyId };

    if (status === "active") filters.isActive = true;
    if (status === "inactive") filters.isActive = false;

    const drivers = await User.find(filters)
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      count: drivers.length,
      drivers,
    });
  } catch (err) {
    console.error("❌ getManagerDrivers error:", err.message);
    res.status(500).json({ error: "Server error loading drivers" });
  }
};

/* ==========================================================
   ✏️ UPDATE DRIVER (Manager)
========================================================== */
export const updateManagerDriver = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;
    const { name, email, phoneNumber } = req.body;

    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const driver = await User.findOne({ _id: id, role: "driver", companyId });

    if (!driver)
      return res.status(404).json({ error: "Driver not found" });

    if (email && email !== driver.email) {
      const exists = await User.findOne({ email });
      if (exists)
        return res.status(400).json({ error: "Email is already used" });

      driver.email = email;
    }

    if (name) driver.name = name;
    if (phoneNumber) driver.phoneNumber = phoneNumber;

    await driver.save();

    const safeDriver = driver.toObject();
    delete safeDriver.passwordHash;

    res.json({
      ok: true,
      message: "Driver updated successfully",
      driver: safeDriver,
    });
  } catch (err) {
    console.error("❌ updateManagerDriver error:", err.message);
    res.status(500).json({ error: "Server error updating driver" });
  }
};

/* ==========================================================
   🔁 TOGGLE DRIVER ACTIVE/INACTIVE
========================================================== */
export const toggleManagerDriverStatus = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;

    const driver = await User.findOne({
      _id: id,
      role: "driver",
      companyId,
    });

    if (!driver)
      return res.status(404).json({ error: "Driver not found" });

    driver.isActive = !driver.isActive;
    await driver.save();

    const safeDriver = driver.toObject();
    delete safeDriver.passwordHash;

    res.json({
      ok: true,
      message: `Driver is now ${driver.isActive ? "active" : "inactive"}`,
      driver: safeDriver,
    });
  } catch (err) {
    console.error("❌ toggleManagerDriverStatus error:", err.message);
    res.status(500).json({ error: "Server error updating driver status" });
  }
};
