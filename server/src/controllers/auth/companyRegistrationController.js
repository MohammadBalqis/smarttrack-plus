import bcrypt from "bcryptjs";
import CompanyApplication from "../../models/CompanyApplication.js";

export const registerCompanyApplication = async (req, res) => {
  try {
    const {
      companyName,
      ownerName,
      email,
      phone,
      address,
      businessCategory,
      commercialRegistrationNumber,
      password,
    } = req.body;

    if (!companyName || !ownerName || !email || !password || !commercialRegistrationNumber) {
      return res.status(400).json({ ok: false, error: "Missing required fields." });
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, error: "1 official document is required." });
    }

    const exists = await CompanyApplication.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ ok: false, error: "This email already has an application." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const app = await CompanyApplication.create({
      companyName: companyName.trim(),
      ownerName: ownerName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || "",
      address: address || "",
      businessCategory: businessCategory || "other",
      commercialRegistrationNumber: commercialRegistrationNumber.trim(),
      passwordHash,
      document: {
        fileName: req.file.originalname || "",
        filePath: req.file.path,
        mimeType: req.file.mimetype,
      },
      status: "pending",
    });

    return res.status(201).json({
      ok: true,
      message: "Application submitted. Wait for System Owner approval before login.",
      applicationId: app._id,
      status: app.status,
    });
  } catch (err) {
    console.error("registerCompanyApplication:", err);
    return res.status(500).json({ ok: false, error: "Server error." });
  }
};
