import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";

/* =====================================================
   CUSTOMER REGISTER
   POST /api/auth/register-customer
===================================================== */
export const registerCustomer = async (req, res) => {
  try {
    const { phone, password, address, name } = req.body;

    /* ===============================
       VALIDATION
    ================================ */
    if (!phone || !password) {
      return res.status(400).json({
        ok: false,
        error: "Phone number and password are required",
      });
    }

    /* ===============================
       CHECK EXISTING PHONE
    ================================ */
    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(400).json({
        ok: false,
        error: "This phone number is already registered",
      });
    }

    /* ===============================
       HASH PASSWORD
    ================================ */
    const passwordHash = await bcrypt.hash(password, 10);

    /* ===============================
       CREATE CUSTOMER
    ================================ */
    const customer = await User.create({
      role: "customer",
      name: name || "Customer",
      phone,
      passwordHash,
      address: address || "",
      profileImage: req.file?.path || "",
      createdVia: "self",
      isActive: true,
    });

    /* ===============================
       AUTO LOGIN (JWT)
    ================================ */
    const token = jwt.sign(
      {
        uid: customer._id,
        role: customer.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.status(201).json({
      ok: true,
      message: "Customer registered successfully",
      token,
      user: {
        id: customer._id,
        role: customer.role,
        phone: customer.phone,
        name: customer.name,
      },
    });
  } catch (err) {
    console.error("Customer register error:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error while registering customer",
    });
  }
};
