// server/src/routes/invoiceRoutes.js
import { Router } from "express";
import Invoice from "../models/Invoice.js";
import Trip from "../models/Trip.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import GlobalSettings from "../models/GlobalSettings.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { logActivity } from "../utils/activityLogger.js";

const router = Router();

/* ==========================================================
   🧠 Helper: resolve company scope
   ========================================================== */
const resolveCompanyScope = (req, queryCompanyId = null) => {
  if (req.user.role === "company") return req.user._id;
  if (req.user.role === "manager") return req.user.companyId;
  if (req.user.role === "owner" || req.user.role === "superadmin")
    return queryCompanyId || null;
  return null;
};

/* ==========================================================
   🧮 Helper: compute invoice amounts from trip
   ========================================================== */
const computeInvoiceAmounts = (trip, { discountAmount = 0, taxRate = 0 } = {}) => {
  const itemsSubtotal =
    (trip.orderItems || []).reduce(
      (sum, item) => sum + (item.subtotal || item.price * (item.quantity || 1) || 0),
      0
    ) || 0;

  const deliveryFee = trip.deliveryFee || 0;
  const discount = discountAmount > 0 ? discountAmount : 0;

  const base = Math.max(0, itemsSubtotal + deliveryFee - discount);
  const tax = taxRate > 0 ? (base * taxRate) / 100 : 0;
  const total = base + tax;

  return {
    itemsSubtotal,
    deliveryFee,
    discountAmount: discount,
    taxRate,
    taxAmount: tax,
    totalAmount: total,
  };
};

/* ==========================================================
   🔢 Helper: generate invoice number
   ========================================================== */
const generateInvoiceNumber = async () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000); // 4 digits
  const base = `INV-${y}${m}${d}-${rand}`;

  // quick check to avoid collision
  const existing = await Invoice.findOne({ invoiceNumber: base });
  if (!existing) return base;
  return `${base}-${Math.floor(Math.random() * 99)}`;
};

/* ==========================================================
   🧾 1. Generate invoice from Trip
   ========================================================== */
/*
POST /api/invoices/generate
Body: {
  tripId: "...",
  discountAmount?: Number,
  taxRate?: Number,
  currency?: "USD",
  dueAt?: Date,
  notes?: String
}
*/
router.post(
  "/generate",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const settings = await GlobalSettings.findOne();
      if (settings?.maintenanceMode && req.user.role !== "superadmin") {
        return res.status(503).json({
          ok: false,
          error: "System is under maintenance.",
        });
      }

      const {
        tripId,
        discountAmount = 0,
        taxRate = 0,
        currency,
        dueAt,
        notes,
        companyId: bodyCompanyId,
      } = req.body;

      if (!tripId)
        return res.status(400).json({ error: "tripId is required" });

      const companyScope = resolveCompanyScope(req, bodyCompanyId);

      const trip = await Trip.findById(tripId)
        .populate("companyId", "name email")
        .populate("customerId", "name email phone")
        .populate("driverId", "name");

      if (!trip)
        return res.status(404).json({ error: "Trip not found" });

      if (
        companyScope &&
        String(trip.companyId?._id || trip.companyId) !== String(companyScope)
      ) {
        return res
          .status(403)
          .json({ error: "Not allowed to generate invoice for this trip" });
      }

      // If invoice already exists, return it (idempotent)
      let existing = await Invoice.findOne({ tripId: trip._id });
      if (existing) {
        return res.json({
          ok: true,
          message: "Invoice already exists for this trip",
          invoice: existing,
        });
      }

      // Try to find related payment (for method + paid status)
      const payment = await Payment.findOne({ tripId: trip._id }).sort({
        createdAt: -1,
      });

      const amounts = computeInvoiceAmounts(trip, { discountAmount, taxRate });

      const invoiceNumber = await generateInvoiceNumber();

      const invoice = await Invoice.create({
        tripId: trip._id,
        paymentId: payment?._id || null,
        companyId: trip.companyId?._id || trip.companyId,
        customerId: trip.customerId?._id || trip.customerId,
        driverId: trip.driverId?._id || trip.driverId,

        invoiceNumber,
        currency: currency || "USD",

        itemsSubtotal: amounts.itemsSubtotal,
        deliveryFee: amounts.deliveryFee,
        discountAmount: amounts.discountAmount,
        taxRate: amounts.taxRate,
        taxAmount: amounts.taxAmount,
        totalAmount: amounts.totalAmount,

        paymentMethod: payment?.method || "unknown",
        status: payment?.status === "paid" ? "paid" : "unpaid",

        companyName: trip.companyId?.name || "",
        customerName: trip.customerId?.name || "",
        customerEmail: trip.customerId?.email || "",
        customerPhone: trip.customerId?.phone || "",

        issuedAt: new Date(),
        dueAt: dueAt || null,
        notes: notes || "",
        meta: {
          tripStatus: trip.status,
          paymentStatus: payment?.status || trip.paymentStatus,
        },
      });

      await logActivity({
        userId: req.user._id,
        action: "INVOICE_GENERATE",
        description: `Generated invoice ${invoice.invoiceNumber} for trip ${trip._id}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
        meta: {
          invoiceId: invoice._id,
          tripId: trip._id,
          companyId: invoice.companyId,
        },
      });

      res.status(201).json({
        ok: true,
        message: "Invoice generated successfully",
        invoice,
      });
    } catch (err) {
      console.error("❌ Invoice generate error:", err.message);
      res.status(500).json({ error: "Server error generating invoice" });
    }
  }
);

/* ==========================================================
   🔍 2. Get Invoice by Trip
   ========================================================== */
router.get(
  "/by-trip/:tripId",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const companyScope = resolveCompanyScope(req, req.query.companyId);

      const invoice = await Invoice.findOne({ tripId: req.params.tripId })
        .populate("tripId")
        .populate("paymentId")
        .populate("companyId", "name email")
        .populate("customerId", "name email phone")
        .populate("driverId", "name");

      if (!invoice)
        return res.status(404).json({ error: "Invoice not found" });

      if (
        companyScope &&
        String(invoice.companyId?._id || invoice.companyId) !==
          String(companyScope)
      ) {
        return res.status(403).json({ error: "Not allowed" });
      }

      res.json({ ok: true, invoice });
    } catch (err) {
      console.error("❌ Invoice by-trip error:", err.message);
      res.status(500).json({ error: "Server error loading invoice" });
    }
  }
);

/* ==========================================================
   📄 3. Get Invoice by ID
   ========================================================== */
router.get(
  "/:invoiceId",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const companyScope = resolveCompanyScope(req, req.query.companyId);

      const invoice = await Invoice.findById(req.params.invoiceId)
        .populate("tripId")
        .populate("paymentId")
        .populate("companyId", "name email")
        .populate("customerId", "name email phone")
        .populate("driverId", "name");

      if (!invoice)
        return res.status(404).json({ error: "Invoice not found" });

      if (
        companyScope &&
        String(invoice.companyId?._id || invoice.companyId) !==
          String(companyScope)
      ) {
        return res.status(403).json({ error: "Not allowed" });
      }

      res.json({ ok: true, invoice });
    } catch (err) {
      console.error("❌ Invoice detail error:", err.message);
      res.status(500).json({ error: "Server error loading invoice" });
    }
  }
);

/* ==========================================================
   📚 4. List Invoices (filterable)
   ========================================================== */
/*
GET /api/invoices/list?status=&customerId=&from=&to=&companyId=
*/
router.get(
  "/",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const {
        status,
        customerId,
        from,
        to,
        companyId: queryCompanyId,
        page = 1,
        limit = 20,
      } = req.query;

      const companyScope = resolveCompanyScope(req, queryCompanyId);
      const filter = {};

      if (companyScope) filter.companyId = companyScope;
      if (status) filter.status = status;
      if (customerId) filter.customerId = customerId;

      if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to) filter.createdAt.$lte = new Date(to);
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [total, invoices] = await Promise.all([
        Invoice.countDocuments(filter),
        Invoice.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate("customerId", "name email")
          .populate("companyId", "name email")
          .populate("driverId", "name"),
      ]);

      res.json({
        ok: true,
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
        invoices,
      });
    } catch (err) {
      console.error("❌ Invoice list error:", err.message);
      res.status(500).json({ error: "Server error listing invoices" });
    }
  }
);

/* ==========================================================
   🧮 5. System Owner — Companies Billing Summary
   ========================================================== */
/*
GET /api/invoices/system/companies-summary
*/
router.get(
  "/system/companies-summary",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const agg = await Invoice.aggregate([
        {
          $group: {
            _id: "$companyId",
            totalInvoiced: { $sum: "$totalAmount" },
            totalInvoices: { $sum: 1 },
          },
        },
      ]);

      const companies = await User.find({
        _id: { $in: agg.map((a) => a._id) },
      }).select("name email");

      const map = {};
      companies.forEach((c) => {
        map[String(c._id)] = { name: c.name, email: c.email };
      });

      const result = agg.map((row) => ({
        companyId: row._id,
        companyName: map[String(row._id)]?.name || "",
        companyEmail: map[String(row._id)]?.email || "",
        totalInvoiced: row.totalInvoiced,
        totalInvoices: row.totalInvoices,
      }));

      res.json({
        ok: true,
        companies: result,
      });
    } catch (err) {
      console.error("❌ Companies summary error:", err.message);
      res.status(500).json({ error: "Server error summarizing companies" });
    }
  }
);

export default router;
