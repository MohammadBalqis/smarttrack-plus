// server/src/routes/customerManagementRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Payment from "../models/Payment.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

/* ==========================================================
   📁 MULTER STORAGE FOR CUSTOMER DOCUMENTS
========================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join("uploads", "customers", "documents");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const upload = multer({ storage });

/* ==========================================================
   🟢 1. LIST ALL CUSTOMERS
========================================================== */
router.get(
  "/",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const customers = await User.find({ role: "customer" })
        .select("-passwordHash")
        .sort({ createdAt: -1 });

      res.json({ ok: true, customers });
    } catch (err) {
      res.status(500).json({ error: "Error loading customers" });
    }
  }
);

/* ==========================================================
   🔍 2. SEARCH CUSTOMERS (email/phone/name)
========================================================== */
router.get(
  "/search",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const q = req.query.q || "";
      const customers = await User.find({
        role: "customer",
        $or: [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } },
        ],
      }).select("-passwordHash");

      res.json({ ok: true, customers });
    } catch (err) {
      res.status(500).json({ error: "Search failed" });
    }
  }
);

/* ==========================================================
   🚫 3. SUSPEND / ACTIVATE CUSTOMER
========================================================== */
router.patch(
  "/:customerId/toggle-active",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.customerId);
      if (!user || user.role !== "customer")
        return res.status(404).json({ error: "Customer not found" });

      user.isActive = !user.isActive;
      await user.save();

      res.json({
        ok: true,
        message: `Customer is now ${user.isActive ? "active" : "suspended"}`,
        user,
      });
    } catch {
      res.status(500).json({ error: "Error updating status" });
    }
  }
);

/* ==========================================================
   📝 4. ADD NOTES TO CUSTOMER
========================================================== */
router.patch(
  "/:customerId/notes",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const { notes } = req.body;

      const customer = await User.findByIdAndUpdate(
        req.params.customerId,
        { customerNotes: notes },
        { new: true }
      ).select("-passwordHash");

      res.json({ ok: true, customer });
    } catch {
      res.status(500).json({ error: "Error updating notes" });
    }
  }
);

/* ==========================================================
   👁️ 5. VIEW CUSTOMER FULL PROFILE
========================================================== */
router.get(
  "/:customerId/details",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const customer = await User.findById(req.params.customerId)
        .select("-passwordHash");

      res.json({ ok: true, customer });
    } catch {
      res.status(500).json({ error: "Error loading customer" });
    }
  }
);

/* ==========================================================
   🧾 6. CUSTOMER TRIP HISTORY
========================================================== */
router.get(
  "/:customerId/trips",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const trips = await Trip.find({ customerId: req.params.customerId })
        .sort({ createdAt: -1 });

      res.json({ ok: true, trips });
    } catch {
      res.status(500).json({ error: "Error loading trips" });
    }
  }
);

/* ==========================================================
   💰 7. CUSTOMER PAYMENT HISTORY
========================================================== */
router.get(
  "/:customerId/payments",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const payments = await Payment.find({ customerId: req.params.customerId })
        .sort({ createdAt: -1 });

      res.json({ ok: true, payments });
    } catch {
      res.status(500).json({ error: "Error loading payments" });
    }
  }
);

/* ==========================================================
   📤 8. CUSTOMER DOCUMENT UPLOAD
========================================================== */
router.post(
  "/:customerId/upload-document",
  protect,
  authorizeRoles("company", "manager"),
  upload.single("document"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "Document is required" });

      const filePath = `/uploads/customers/documents/${req.file.filename}`;

      const updated = await User.findByIdAndUpdate(
        req.params.customerId,
        {
          $push: {
            customerDocuments: {
              fileName: req.file.originalname,
              filePath,
            },
          },
        },
        { new: true }
      );

      res.json({ ok: true, updated });
    } catch {
      res.status(500).json({ error: "Error uploading document" });
    }
  }
);

export default router;
