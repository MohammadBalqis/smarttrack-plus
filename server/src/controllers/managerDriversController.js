// server/src/controllers/managerDriversController.js
import User from "../models/User.js";
import { resolveCompanyId } from "../utils/resolveCompanyId.js";

/* ==========================================================
   📌 GET ALL DRIVERS FOR MANAGER / COMPANY
========================================================== */
export const getManagerDrivers = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const isManager = req.user.role === "manager";
    const shopId = isManager ? req.user.shopId : null;

    const { status } = req.query; // active|inactive

    const filters = { role: "driver", companyId };
    if (shopId) filters.shopId = shopId;

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
   ✏️ UPDATE DRIVER (Manager / Company)
========================================================== */
export const updateManagerDriver = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const isManager = req.user.role === "manager";
    const shopId = isManager ? req.user.shopId : null;

    const { id } = req.params;
    const { name, email, phone } = req.body;

    const query = { _id: id, role: "driver", companyId };
    if (shopId) query.shopId = shopId;

    const driver = await User.findOne(query);

    if (!driver)
      return res.status(404).json({ error: "Driver not found" });

    if (email && email !== driver.email) {
      const exists = await User.findOne({ email });
      if (exists)
        return res.status(400).json({ error: "Email is already used" });

      driver.email = email;
    }

    if (name) driver.name = name;
    if (phone) driver.phone = phone;

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
    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const isManager = req.user.role === "manager";
    const shopId = isManager ? req.user.shopId : null;

    const { id } = req.params;

    const query = {
      _id: id,
      role: "driver",
      companyId,
    };
    if (shopId) query.shopId = shopId;

    const driver = await User.findOne(query);

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
