import bcrypt from "bcryptjs";
import CompanyApplication from "../models/CompanyApplication.js";

export const submitCompanyApplication = async (req, res) => {
  try {
    const {
      companyName,
      ownerName,
      email,
      phone,
      address,
      businessCategory,
      businessCategoryOther,
      commercialRegistrationNumber,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email and password are required",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const application = await CompanyApplication.create({
      companyName,
      ownerName,
      companyEmail: email, // ✅ CORRECT FIELD
      phone,
      address,

      // ✅ FORCE SAFE CATEGORY
      businessCategory: "other",
      businessCategoryOther:
        businessCategory === "other"
          ? businessCategoryOther?.trim()
          : null,

      commercialRegistrationNumber,
      passwordHash,
      documentUrl: req.file?.path,
    });

    res.status(201).json({
      ok: true,
      message: "Application submitted successfully",
      application,
    });
  } catch (err) {
    console.error("submitCompanyApplication error:", err);
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
};
