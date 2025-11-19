// server/src/routes/publicApiRoutes.js
import { Router } from "express";
import Company from "../models/Company.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import {
  publicApiLimiter,
} from "../middleware/rateLimitMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import crypto from "crypto";
import Joi from "joi";
import { validate } from "../middleware/validateMiddleware.js";

const router = Router();

/* ==========================================================
   🔐 MIDDLEWARE — Validate API Key (for public partner companies)
========================================================== */
const validateApiKey = async (req, res, next) => {
  try {
    const key = req.headers["x-api-key"];

    if (!key) {
      return res.status(401).json({ ok: false, error: "Missing API Key" });
    }

    const company = await Company.findOne({ apiKey: key });

    if (!company) {
      return res.status(403).json({ ok: false, error: "Invalid API Key" });
    }

    if (company.apiEnabled === false) {
      return res
        .status(403)
        .json({ ok: false, error: "API Access Disabled for this company" });
    }

    req.company = company;
    next();
  } catch (err) {
    console.error("API Key Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

/* ==========================================================
   ✅ Joi schema for public order creation
========================================================== */
const publicOrderCreateSchema = Joi.object({
  body: Joi.object({
    customerName: Joi.string().min(2).max(80).required(),
    customerPhone: Joi.string().min(6).max(30).required(),
    pickup: Joi.object({
      address: Joi.string().min(3).required(),
      lat: Joi.number().optional(),
      lng: Joi.number().optional(),
    }).required(),
    dropoff: Joi.object({
      address: Joi.string().min(3).required(),
      lat: Joi.number().optional(),
      lng: Joi.number().optional(),
    }).required(),
    deliveryFee: Joi.number().min(0).optional(),
  }),
  query: Joi.object().optional(),
  params: Joi.object().optional(),
});

/* ==========================================================
   🟣 10I-A — PUBLIC: Create Order (Generate Trip Without Login)
   - Uses API Key (per-company)
   - Customer can order from many companies (companyIds array)
========================================================== */
router.post(
  "/order/create",
  publicApiLimiter,
  validate(publicOrderCreateSchema),
  validateApiKey,
  async (req, res) => {
    try {
      const { customerName, customerPhone, pickup, dropoff, deliveryFee } =
        req.body;

      // 🔁 1. Reuse existing customer by phone if exists
      let customer = await User.findOne({
        role: "customer",
        phone: customerPhone,
      });

      if (!customer) {
        // create "public" customer (not logged in yet)
        const randomPassword = crypto.randomBytes(32).toString("hex");

        customer = await User.create({
          name: customerName,
          email: `${customerPhone}@public.customer`,
          passwordHash: randomPassword,
          role: "customer",
          phone: customerPhone,
          companyIds: [req.company._id],
        });
      } else {
        // ensure this company is in companyIds
        if (
          !customer.companyIds ||
          !customer.companyIds.some(
            (id) => String(id) === String(req.company._id)
          )
        ) {
          customer.companyIds = customer.companyIds || [];
          customer.companyIds.push(req.company._id);
          await customer.save();
        }
      }

      // 2. Create trip
      const trip = await Trip.create({
        companyId: req.company._id,
        customerId: customer._id,
        pickupLocation: pickup,
        dropoffLocation: dropoff,
        deliveryFee: deliveryFee || req.company.settings.deliveryFeeDefault,
        status: "pending",
      });

      res.status(201).json({
        ok: true,
        message: "Order created successfully",
        tripId: trip._id,
      });
    } catch (err) {
      console.error("Create Public Order Error:", err.message);
      res.status(500).json({ error: "Server error creating order" });
    }
  }
);

/* ==========================================================
   🟣 10I-B — PUBLIC: Track Order Status (for customers)
========================================================== */
router.get(
  "/order/track/:tripId",
  publicApiLimiter,
  validateApiKey,
  async (req, res) => {
    try {
      const { tripId } = req.params;

      const trip = await Trip.findOne({
        _id: tripId,
        companyId: req.company._id,
      })
        .populate("driverId", "name phone profileImage")
        .populate("vehicleId", "plateNumber model brand")
        .populate("customerId", "name phone");

      if (!trip) {
        return res.status(404).json({ ok: false, error: "Order not found" });
      }

      res.json({
        ok: true,
        tripId,
        status: trip.status,
        liveStatus: trip.liveStatus,
        driver: trip.driverId,
        vehicle: trip.vehicleId,
        pickup: trip.pickupLocation,
        dropoff: trip.dropoffLocation,
        routeHistory: trip.routeHistory,
      });
    } catch (err) {
      console.error("Track Order Error:", err.message);
      res.status(500).json({ error: "Server error tracking order" });
    }
  }
);

/* ==========================================================
   🟣 10I-C — SUPERADMIN: Generate API Key for Company
   - Protected with JWT + role
========================================================== */
router.post(
  "/superadmin/generate-key/:companyId",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const key = crypto.randomBytes(32).toString("hex");

      const company = await Company.findByIdAndUpdate(
        req.params.companyId,
        { apiKey: key, apiEnabled: true },
        { new: true }
      );

      if (!company) {
        return res.status(404).json({ ok: false, error: "Company not found" });
      }

      res.json({
        ok: true,
        apiKey: key,
        companyId: company._id,
      });
    } catch (err) {
      console.error("Generate API Key Error:", err.message);
      res.status(500).json({ error: "Server error generating API Key" });
    }
  }
);

export default router;
