// server/src/routes/paymentRoutes.js
import { Router } from "express";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import Payment from "../models/Payment.js";
import Trip from "../models/Trip.js";
import GlobalSettings from "../models/GlobalSettings.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { loadGlobalSettings } from "../middleware/globalSettingsMiddleware.js";

const router = Router();

/* ==========================================================
   🔧 Helper Functions
   ========================================================== */

// Ensure folder exists
const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Generate invoice number
const generateInvoiceNumber = (companyId, periodLabel) => {
  const shortCompany = String(companyId).slice(-6).toUpperCase();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${shortCompany}-${periodLabel}-${random}`;
};

// Generate invoice PDF
const generateInvoicePdf = ({ invoiceNumber, companyInfo, period, totals, payments }) => {
  return new Promise((resolve, reject) => {
    const invoicesDir = path.join("uploads", "invoices");
    ensureDirExists(invoicesDir);

    const fileName = `${invoiceNumber}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    /* ---------------- Header ---------------- */
    doc.fontSize(20).text("SmartTrack Plus - Invoice", { align: "right" }).moveDown(0.5);
    doc.fontSize(12)
      .text(`Invoice No: ${invoiceNumber}`, { align: "right" })
      .text(`Period: ${period.label}`, { align: "right" })
      .text(`Generated At: ${new Date().toLocaleString()}`, { align: "right" })
      .moveDown(1);

    /* ---------------- Company ---------------- */
    doc.fontSize(14).text("Billed To:", { underline: true }).moveDown(0.5);
    doc.fontSize(12)
      .text(companyInfo.name || "Company")
      .text(companyInfo.email || "")
      .text(companyInfo.phone || "")
      .text(companyInfo.address || "")
      .moveDown(1);

    /* ---------------- Summary ---------------- */
    doc.fontSize(14).text("Invoice Summary", { underline: true }).moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Total Trips Paid: ${totals.count}`);
    doc.text(`Total Amount: ${totals.totalAmount.toFixed(2)}`);
    doc.text(`Delivery Fees Total: ${totals.deliveryFeeTotal.toFixed(2)}`);
    doc.text(`Products Total: ${totals.productTotal.toFixed(2)}`);
    doc.text(`Discounts Total: ${totals.discountTotal.toFixed(2)}`);
    doc.text(`Tax Total: ${totals.taxTotal.toFixed(2)}`).moveDown(0.5);
    doc.text(`Driver Earnings Total: ${totals.driverEarningTotal.toFixed(2)}`);
    doc.text(`Company Earnings Total: ${totals.companyEarningTotal.toFixed(2)}`);
    doc.text(`Platform Earnings Total: ${totals.platformEarningTotal.toFixed(2)}`).moveDown(1);

    /* ---------------- Payments ---------------- */
    doc.fontSize(14).text("Payments Included", { underline: true }).moveDown(0.5);
    doc.fontSize(10);

    payments.forEach((p) => {
      doc.text(
        `Payment ID: ${p._id} | Trip: ${p.tripId || "-"} | Method: ${p.method} | Total: ${p.totalAmount} | Status: ${p.status}`
      );
    });

    doc.end();

    writeStream.on("finish", () =>
      resolve(`/uploads/invoices/${fileName}`)
    );
    writeStream.on("error", reject);
  });
};

/* ==========================================================
   🧾 1. Collect Payment
========================================================== */
router.post(
  "/collect",
  protect,
  authorizeRoles("driver", "manager", "company", "owner", "superadmin"),
  async (req, res) => {
    try {
      const settings = await loadGlobalSettings();
      if (settings?.maintenanceMode && req.user.role !== "superadmin") {
        return res.status(503).json({ ok: false, error: "System under maintenance." });
      }

      const { tripId, amount, method = "cod", notes, collectedBy, companyId: bodyCompanyId } = req.body;

      if (!tripId) return res.status(400).json({ error: "tripId is required" });

      const trip = await Trip.findById(tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      /* ---------------- Determine company scope ---------------- */
      let companyId =
        req.user.role === "company" ? req.user._id :
        req.user.role === "manager" || req.user.role === "driver" ? req.user.companyId :
        req.user.role === "owner" || req.user.role === "superadmin" ? bodyCompanyId || trip.companyId :
        null;

      if (!companyId) {
        return res.status(400).json({
          error: "companyId required when owner/superadmin collects payment",
        });
      }

      if (String(companyId) !== String(trip.companyId)) {
        return res.status(403).json({ error: "This trip does not belong to your company" });
      }

      /* ---------------- Amount Breakdown ---------------- */
      const deliveryFee = trip.deliveryFee || 0;
      const productTotal = 0;
      const discountAmount = 0;
      const taxAmount = 0;

      const baseTotal = deliveryFee + productTotal + taxAmount - discountAmount;
      const totalAmount = typeof amount === "number" ? amount : baseTotal;

      /* ---------------- Earnings Split ---------------- */
      const driverPct = Number(process.env.DRIVER_SHARE_PCT || 60);
      const platformPct = Number(process.env.PLATFORM_COMMISSION_PCT || 10);

      const platformEarning = (totalAmount * platformPct) / 100;
      const driverEarning = (totalAmount * driverPct) / 100;
      const companyEarning = totalAmount - platformEarning - driverEarning;

      /* ---------------- Create Payment ---------------- */
      const payment = await Payment.create({
        tripId: trip._id,
        companyId,
        driverId: trip.driverId,
        customerId: trip.customerId,
        totalAmount,
        deliveryFee,
        productTotal,
        discountAmount,
        taxAmount,
        driverEarning,
        companyEarning,
        platformEarning,
        method,
        status: "paid",
        notes,
        paidAt: new Date(),
        createdBy: req.user._id,
      });

      trip.paymentStatus = "paid";
      await trip.save();

      res.status(201).json({ ok: true, message: "Payment collected", payment });
    } catch (err) {
      console.error("❌ collect payment error:", err);
      res.status(500).json({ error: "Server error collecting payment" });
    }
  }
);

/* ==========================================================
   📋 2. List Payments
========================================================== */
router.get(
  "/list",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const settings = await loadGlobalSettings();
      if (settings?.maintenanceMode && req.user.role !== "superadmin") {
        return res.status(503).json({ error: "System under maintenance." });
      }

      const { companyId: queryCompanyId } = req.query;

      let match = {};

      match.companyId =
        req.user.role === "company" ? req.user._id :
        req.user.role === "manager" ? req.user.companyId :
        req.user.role === "owner" || req.user.role === "superadmin" ? queryCompanyId :
        null;

      const payments = await Payment.find(match)
        .sort({ createdAt: -1 })
        .populate("tripId", "status deliveryFee")
        .populate("driverId", "name")
        .populate("customerId", "name");

      res.json({ ok: true, count: payments.length, payments });
    } catch (err) {
      console.error("❌ list payments error:", err);
      res.status(500).json({ error: "Server error listing payments" });
    }
  }
);

/* ==========================================================
   📊 3. Company Summary
========================================================== */
router.get(
  "/summary/company",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const settings = await loadGlobalSettings();
      if (settings?.maintenanceMode && req.user.role !== "superadmin") {
        return res.status(503).json({ error: "System under maintenance." });
      }

      const { companyId: queryCompanyId } = req.query;

      let match = {};

      match.companyId =
        req.user.role === "company" ? req.user._id :
        req.user.role === "manager" ? req.user.companyId :
        req.user.role === "owner" || req.user.role === "superadmin" ? queryCompanyId :
        null;

      const payments = await Payment.find(match);

      const totalRevenue = payments.reduce((s, p) => s + p.totalAmount, 0);

      const byMethod = payments.reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + p.totalAmount;
        return acc;
      }, {});

      const platformTotal = payments.reduce(
        (sum, p) => sum + (p.platformEarning || 0),
        0
      );

      res.json({
        ok: true,
        totalPayments: payments.length,
        totalRevenue,
        platformTotal,
        byMethod,
      });
    } catch (err) {
      console.error("❌ summary error:", err);
      res.status(500).json({ error: "Summary generation error" });
    }
  }
);

/* ==========================================================
   👨‍✈️ 4. Driver Summary
========================================================== */
router.get(
  "/summary/driver",
  protect,
  authorizeRoles("driver", "manager", "company", "owner", "superadmin"),
  async (req, res) => {
    try {
      const settings = await loadGlobalSettings();
      if (settings?.maintenanceMode && req.user.role !== "superadmin") {
        return res.status(503).json({ error: "System under maintenance." });
      }

      const { driverId: queryDriverId, companyId: queryCompanyId } = req.query;

      let driverId = req.user.role === "driver" ? req.user._id : queryDriverId;

      let match = { driverId };

      if (req.user.role === "driver") {
        match.companyId = req.user.companyId;
      }
      if (req.user.role === "company") {
        match.companyId = req.user._id;
      }
      if (req.user.role === "manager") {
        match.companyId = req.user.companyId;
      }
      if (req.user.role === "owner" || req.user.role === "superadmin") {
        if (queryCompanyId) match.companyId = queryCompanyId;
      }

      const payments = await Payment.find(match);

      const totalCollected = payments.reduce((s, p) => s + p.totalAmount, 0);
      const driverEarnings = payments.reduce((s, p) => s + p.driverEarning, 0);

      const byMethod = payments.reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + p.totalAmount;
        return acc;
      }, {});

      res.json({
        ok: true,
        driverId,
        totalPayments: payments.length,
        totalCollected,
        driverEarnings,
        byMethod,
      });
    } catch (err) {
      console.error("❌ driver summary error:", err);
      res.status(500).json({ error: "Driver summary error" });
    }
  }
);

/* ==========================================================
   🧾 5. Generate Invoice (PDF)
========================================================== */
router.post(
  "/invoice/generate",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const settings = await loadGlobalSettings();
      if (settings?.maintenanceMode && req.user.role !== "superadmin") {
        return res.status(503).json({ error: "System under maintenance." });
      }

      const { month, year, companyId: bodyCompanyId } = req.body;

      /* ---------------- Determine company ---------------- */
      let companyId =
        req.user.role === "company" ? req.user._id :
        req.user.role === "manager" ? req.user.companyId :
        req.user.role === "owner" || req.user.role === "superadmin" ? bodyCompanyId :
        null;

      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      /* ---------------- Period ---------------- */
      const now = new Date();
      const m = month || now.getMonth() + 1;
      const y = year || now.getFullYear();

      const periodStart = new Date(y, m - 1, 1);
      const periodEnd = new Date(y, m, 1);
      const periodLabel = `${y}${String(m).padStart(2, "0")}`;

      const payments = await Payment.find({
        companyId,
        status: "paid",
        createdAt: { $gte: periodStart, $lt: periodEnd },
      });

      if (!payments.length) {
        return res.status(400).json({ error: "No paid payments found" });
      }

      /* ---------------- Totals ---------------- */
      const totals = payments.reduce(
        (acc, p) => {
          acc.count++;
          acc.totalAmount += p.totalAmount;
          acc.deliveryFeeTotal += p.deliveryFee;
          acc.productTotal += p.productTotal;
          acc.discountTotal += p.discountAmount;
          acc.taxTotal += p.taxAmount;
          acc.driverEarningTotal += p.driverEarning;
          acc.companyEarningTotal += p.companyEarning;
          acc.platformEarningTotal += p.platformEarning;
          return acc;
        },
        {
          count: 0,
          totalAmount: 0,
          deliveryFeeTotal: 0,
          productTotal: 0,
          discountTotal: 0,
          taxTotal: 0,
          driverEarningTotal: 0,
          companyEarningTotal: 0,
          platformEarningTotal: 0,
        }
      );

      /* ---------------- Generate Invoice ---------------- */
      const invoiceNumber = generateInvoiceNumber(companyId, periodLabel);

      const companyInfo = {
        name: `Company (${companyId})`,
        email: "",
        phone: "",
        address: "",
      };

      const pdfUrl = await generateInvoicePdf({
        invoiceNumber,
        companyInfo,
        period: { start: periodStart, end: periodEnd, label: periodLabel },
        totals,
        payments,
      });

      await Payment.updateMany(
        { _id: { $in: payments.map((p) => p._id) } },
        { invoiceNumber, invoicePdfUrl: pdfUrl, generationDate: new Date() }
      );

      res.json({
        ok: true,
        message: "Invoice generated",
        invoice: {
          invoiceNumber,
          pdfUrl,
          period: { month: m, year: y },
          totals,
          count: payments.length,
        },
      });
    } catch (err) {
      console.error("❌ invoice error:", err);
      res.status(500).json({ error: "Invoice generation failed" });
    }
  }
);

export default router;
