import User from "../models/User.js";
import Company from "../models/Company.js"; // if companies stored in User, remove this

export const getSuperadminStats = async (req, res) => {
  try {
    // Count companies
    const totalCompanies = await User.countDocuments({ role: "company" });

    const activeCompanies = await User.countDocuments({
      role: "company",
      isActive: true,
    });

    const suspendedCompanies = await User.countDocuments({
      role: "company",
      isActive: false,
    });

    // Count users by roles
    const totalManagers = await User.countDocuments({ role: "manager" });
    const totalDrivers = await User.countDocuments({ role: "driver" });
    const totalCustomers = await User.countDocuments({ role: "customer" });

    res.json({
      ok: true,
      stats: {
        totalCompanies,
        activeCompanies,
        suspendedCompanies,
        totalManagers,
        totalDrivers,
        totalCustomers,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching superadmin stats:", err.message);
    return res.status(500).json({ error: "Failed to load superadmin stats" });
  }
};
