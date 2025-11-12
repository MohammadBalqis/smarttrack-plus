import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ==========================================================
   🧩 REGISTER — Secure Role Assignment (with Owner Detection)
   ========================================================== */
export const register = async (req, res) => {
  try {
    const { name, email, password, role, companyId } = req.body;

    // 1️⃣ Validate input
    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing required fields" });

    // 2️⃣ Prevent duplicate emails
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ error: "Email is already registered" });

    // 3️⃣ Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4️⃣ Role enforcement logic
    let assignedRole = "driver"; // default role
    const ownerEmail = "mohammad.balqis284@gmail.com"; // 👈 your real Gmail here

    console.log("🔍 Incoming registration:", email, " | Desired role:", role);

    // ✅ Automatically assign owner role if the email matches yours
    if (email.toLowerCase() === ownerEmail.toLowerCase()) {
      assignedRole = "owner";
      console.log("✅ Assigned role: OWNER (auto-detected Gmail)");
    }
    // 🚫 Block manual attempts to register as owner
    else if (role === "owner") {
      return res
        .status(403)
        .json({ error: "You are not allowed to register as 'owner'" });
    }
    // ✅ Allow company self-registration
    else if (role === "company") {
      assignedRole = "company";
      console.log("✅ Assigned role: COMPANY");
    }
    // ✅ Allow manager registration if linked to company
    else if (role === "manager" && companyId) {
      assignedRole = "manager";
      console.log("✅ Assigned role: MANAGER (linked to company)");
    }
    // ✅ Default case — driver
    else {
      assignedRole = "driver";
      console.log("✅ Assigned role: DRIVER (default)");
    }

    // 5️⃣ Create the user
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: assignedRole,
      companyId: companyId || null,
      isActive: true,
    });

    // 6️⃣ Generate JWT
    const token = jwt.sign(
      { uid: user._id, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 7️⃣ Respond
    res.status(201).json({
      ok: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    });

    console.log("✅ Registration complete:", user.email, "=>", user.role);
  } catch (e) {
    console.error("❌ Register error:", e.message);
    res.status(500).json({ error: "Server error during registration" });
  }
};

/* ==========================================================
   🔐 LOGIN — User Authentication
   ========================================================== */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password)
      return res
        .status(400)
        .json({ error: "Please provide both email and password" });

    // 2️⃣ Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // 3️⃣ Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // 4️⃣ Sign JWT
    const token = jwt.sign(
      { uid: user._id, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5️⃣ Respond
    res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    });

    console.log("✅ Login successful:", user.email, "=>", user.role);
  } catch (e) {
    console.error("❌ Login error:", e.message);
    res.status(500).json({ error: "Server error during login" });
  }
};
