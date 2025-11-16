// server/src/controllers/superAdminController.js

import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Payment from "../models/Payment.js";
import bcrypt from "bcryptjs";
import ActivityLog from "../models/ActivityLog.js";

/* ==========================================================
   📊 SUPERADMIN SYSTEM DASHBOARD
========================================================== */
export const getSuperAdminDashboard = async (req, res) => {
  try {
    const totalCompanies = await User.countDocuments({ role: "company" });
    const totalManagers = await User.countDocuments({ role: "manager" });
    const totalDrivers = await User.countDocuments({ role: "driver" });
    const totalCustomers = await User.countDocuments({ role: "customer" });

    const totalTrips = await Trip.countDocuments();
    const activeTrips = await Trip.countDocuments({
      status: { $in: ["assigned", "in_progress"] },
    });

    const totalRevenue = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      ok: true,
      stats: {
        users: {
          companies: totalCompanies,
          managers: totalManagers,
          drivers: totalDrivers,
          customers: totalCustomers,
        },
        trips: {
          totalTrips,
          activeTrips,
        },
        revenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error("❌ Dashboard Error:", err.message);
    res.status(500).json({ error: "Server error loading dashboard" });
  }
};

/* ==========================================================
   🏢 COMPANY: LIST ALL
========================================================== */
export const listAllCompanies = async (req, res) => {
  try {
    const companies = await User.find({ role: "company" })
      .sort({ createdAt: -1 })
      .select("-passwordHash");

    res.json({ ok: true, total: companies.length, companies });
  } catch (err) {
    console.error("❌ Fetch companies error:", err.message);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
};

/* ==========================================================
   🧊 COMPANY: TOGGLE ACTIVE/INACTIVE
========================================================== */
export const toggleCompanyStatus = async (req, res) => {
  try {
    const company = await User.findOne({
      _id: req.params.id,
      role: "company",
    });

    if (!company)
      return res.status(404).json({ error: "Company not found" });

    company.isActive = !company.isActive;
    await company.save();

    res.json({
      ok: true,
      message: `Company ${company.isActive ? "activated" : "suspended"}`,
      company,
    });
  } catch (err) {
    console.error("❌ Toggle company error:", err.message);
    res.status(500).json({ error: "Failed to update company status" });
  }
};

/* ==========================================================
   🏗️ CREATE COMPANY
========================================================== */
export const createCompany = async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing required fields" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);

    const company = await User.create({
      name,
      email,
      passwordHash: hash,
      role: "company",
      companyName: companyName || name,
      isActive: true,
    });

    res.json({ ok: true, message: "Company created", company });
  } catch (err) {
    console.error("❌ Create company error:", err.message);
    res.status(500).json({ error: "Server error creating company" });
  }
};

/* ==========================================================
   ✏️ UPDATE COMPANY
========================================================== */
export const updateCompany = async (req, res) => {
  try {
    const company = await User.findOne({
      _id: req.params.id,
      role: "company",
    });

    if (!company)
      return res.status(404).json({ error: "Company not found" });

    const { name, email, companyName, isActive } = req.body;

    if (name) company.name = name;
    if (email) company.email = email;
    if (companyName) company.companyName = companyName;
    if (typeof isActive === "boolean") company.isActive = isActive;

    await company.save();

    res.json({ ok: true, message: "Company updated", company });
  } catch (err) {
    console.error("❌ Update company error:", err.message);
    res.status(500).json({ error: "Server error updating company" });
  }
};

/* ==========================================================
   🔑 RESET COMPANY PASSWORD
========================================================== */
export const resetCompanyPassword = async (req, res) => {
  try {
    const company = await User.findOne({
      _id: req.params.id,
      role: "company",
    });

    if (!company)
      return res.status(404).json({ error: "Company not found" });

    const { newPassword } = req.body;
    if (!newPassword)
      return res.status(400).json({ error: "newPassword required" });

    company.passwordHash = await bcrypt.hash(newPassword, 10);
    await company.save();

    res.json({
      ok: true,
      message: "Company password reset successfully",
    });
  } catch (err) {
    console.error("❌ Reset password error:", err.message);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

/* ==========================================================
   ❌ DELETE COMPANY + RELATED DATA (SAFE)
========================================================== */
export const deleteCompany = async (req, res) => {
  try {
    const company = await User.findOne({
      _id: req.params.id,
      role: "company",
    });

    if (!company)
      return res.status(404).json({ error: "Company not found" });

    // Delete drivers & managers under this company
    await User.deleteMany({ companyId: req.params.id });

    // Delete trips
    await Trip.deleteMany({ companyId: req.params.id });

    // Delete payments
    await Payment.deleteMany({ companyId: req.params.id });

    // Finally delete company
    await User.findByIdAndDelete(req.params.id);

    res.json({
      ok: true,
      message: "Company and related data deleted",
    });
  } catch (err) {
    console.error("❌ Delete company error:", err.message);
    res.status(500).json({ error: "Failed to delete company" });
  }
};

/* ==========================================================
   🚚 LIST ALL TRIPS (GLOBAL VIEW)
   — SuperAdmin only (NO modifying)
========================================================== */
export const listAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate("driverId", "name email profileImage")
      .populate("vehicleId", "brand model plateNumber status")
      .populate("customerId", "name email phone")
      .populate("companyId", "companyName");

    res.json({
      ok: true,
      total: trips.length,
      trips,
    });
  } catch (err) {
    console.error("❌ List trips error:", err.message);
    res.status(500).json({ error: "Failed to load trips" });
  }
};
export const listActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .populate("userId", "name email role")
      .populate("tripId", "status")
      .populate("companyId", "name email companyName");

    res.json({
      ok: true,
      total: logs.length,
      logs,
    });
  } catch (err) {
    console.error("❌ Activity logs error:", err.message);
    res.status(500).json({ error: "Unable to load logs" });
  }
};