import User from "../../models/User.js";
import Company from "../../models/Company.js";
import bcrypt from "bcryptjs";

export const registerCompany = async (req, res) => {
  try {
    const { companyName, ownerName, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "Email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create pending company
    const company = await Company.create({
      name: companyName,
      isActive: false,
      billingStatus: "pending",
      approved: false,
    });

    // Create company admin user
    const user = await User.create({
      name: ownerName,
      email,
      passwordHash,
      role: "company",
      companyId: company._id,
      isActive: false, // cannot login until approved
    });

    res.json({
      ok: true,
      message: "Registration submitted. Pending approval.",
    });
  } catch (err) {
    console.error("Company register error:", err);
    res.status(500).json({ error: "Server error." });
  }
};
