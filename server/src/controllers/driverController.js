import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const createDriver = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "name, email, password required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);

    const imgRelPath = req.file ? `/uploads/drivers/${req.file.filename}` : null;

    // companyId from the logged-in company/manager
    const companyId = req.user.companyId || (req.user.role === "company" ? req.user._id : null);

    const driver = await User.create({
      name,
      email,
      passwordHash,
      role: "driver",
      companyId: companyId || null,
      profileImage: imgRelPath,
      isActive: true,
    });

    res.status(201).json({
      ok: true,
      message: "Driver created successfully",
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        role: driver.role,
        companyId: driver.companyId,
        profileImage: driver.profileImage,
      },
    });
  } catch (e) {
    console.error("createDriver error:", e);
    res.status(500).json({ error: "Server error" });
  }
};
