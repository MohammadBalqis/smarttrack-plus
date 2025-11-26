// server/src/controllers/paymentController.js
import mongoose from "mongoose";
import Joi from "joi";
import sanitize from "sanitize-html";
import { resolveCompanyId } from "../utils/resolveCompanyId.js";

import Payment from "../models/Payment.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";
import Webhook from "../models/Webhook.js";

// 🔔 Notifications helpers (already used in trip controllers)
import {
  createNotification,
  getPopulatedTripForNotify,
} from "./trip/tripHelpers.js";

const {
  Types: { ObjectId },
} = mongoose;

const isValidObjectId = (id) => ObjectId.isValid(id);

/* ==========================================================
   Joi Schemas
========================================================== */

const createPaymentSchema = Joi.object({
  tripId: Joi.string().required(),
  method: Joi.string().max(40).default("cod"),
  status: Joi.string()
    .valid("paid", "pending", "failed", "refunded")
    .default("paid"),
  totalAmount: Joi.number().min(0).optional(),
  deliveryFee: Joi.number().min(0).optional(),
  productTotal: Joi.number().min(0).optional(),
  discountAmount: Joi.number().min(0).optional(),
  taxAmount: Joi.number().min(0).optional(),
  gatewayFee: Joi.number().min(0).optional(),
  transactionId: Joi.string().max(120).allow(null, ""),
  gatewayResponse: Joi.object().optional(),
  currency: Joi.string().max(10).optional(),
}).unknown(false);

const paginationQuerySchema = Joi.object({
  status: Joi.string()
    .valid("paid", "pending", "failed", "refunded")
    .optional(),
  method: Joi.string().max(40).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),

  // for company / owner / superadmin views
  companyId: Joi.string().optional(),
  driverId: Joi.string().optional(),
}).unknown(true); // allow extra query params if needed

/* ==========================================================
   Helper: resolve companyId from user
========================================================== */
const resolveCompanyIdFromUser = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role))
    return user.companyId;
  return null;
};

/* ==========================================================
   Helper: load company billing config from User
========================================================== */
const getCompanyBillingConfig = async (companyUserId) => {
  if (!companyUserId) return {};

  const companyUser = await User.findById(companyUserId).select(
    "commissionDeliveryPercentage commissionProductPercentage enableProductCommission enableProductSales"
  );

  if (!companyUser) return {};

  return {
    deliveryRate:
      companyUser.commissionDeliveryPercentage !== undefined
        ? companyUser.commissionDeliveryPercentage
        : 20,
    productRate:
      companyUser.commissionProductPercentage !== undefined
        ? companyUser.commissionProductPercentage
        : 10,
    enableProductCommission:
      companyUser.enableProductCommission !== undefined
        ? companyUser.enableProductCommission
        : false,
    enableProductSales:
      companyUser.enableProductSales !== undefined
        ? companyUser.enableProductSales
        : false,
  };
};

/* ==========================================================
   Helper: compute advanced earnings (Option B)
========================================================== */
const computeAdvancedEarnings = async ({ trip, overrides = {}, companyUserId }) => {
  const deliveryFee =
    overrides.deliveryFee !== undefined
      ? overrides.deliveryFee
      : trip.deliveryFee || 0;

  const productTotalFromTrip = Array.isArray(trip.orderItems)
    ? trip.orderItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    : 0;

  const productTotal =
    overrides.productTotal !== undefined
      ? overrides.productTotal
      : productTotalFromTrip;

  const discountAmount = overrides.discountAmount || 0;
  const taxAmount = overrides.taxAmount || 0;
  const gatewayFee = overrides.gatewayFee || 0;
  const currency = overrides.currency || "USD";

  const billing = await getCompanyBillingConfig(companyUserId);

  // Base the customer pays (before discount/tax)
  const rawBase =
    (billing.enableProductSales ? productTotal : 0) + deliveryFee;

  const totalAmount =
    overrides.totalAmount !== undefined
      ? overrides.totalAmount
      : rawBase - discountAmount + taxAmount;

  const deliveryRate = billing.deliveryRate ?? 20;
  const productRate = billing.productRate ?? 10;
  const enableProductCommission = billing.enableProductCommission ?? false;

  const companyDeliveryCommissionAmount = (deliveryFee * deliveryRate) / 100;

  const companyProductCommissionAmount = enableProductCommission
    ? (productTotal * productRate) / 100
    : 0;

  const companyEarning =
    companyDeliveryCommissionAmount + companyProductCommissionAmount;

  // For now, platformEarning is 0 (can be extended later)
  const platformEarning = 0;

  // Driver gets the rest after company + platform + gateway fee
  const driverEarning =
    totalAmount - companyEarning - platformEarning - gatewayFee;

  const paymentBreakdown = {
    deliveryFee,
    productTotal,
    discountAmount,
    taxAmount,
    gatewayFee,
  };

  return {
    totalAmount: Math.max(totalAmount, 0),
    deliveryFee: Math.max(deliveryFee, 0),
    productTotal: Math.max(productTotal, 0),
    discountAmount: Math.max(discountAmount, 0),
    taxAmount: Math.max(taxAmount, 0),
    gatewayFee: Math.max(gatewayFee, 0),
    driverEarning: Math.max(driverEarning, 0),
    companyEarning: Math.max(companyEarning, 0),
    platformEarning: Math.max(platformEarning, 0),
    currency,
    paymentBreakdown,
  };
};

/* ==========================================================
   Helper: trigger webhooks for payment events
========================================================== */
const triggerPaymentWebhooks = async (companyId, event, payload) => {
  try {
    if (!companyId) return;

    const webhooks = await Webhook.find({
      companyId,
      isActive: true,
      events: event,
    });

    if (!webhooks.length) return;

    const doPost = async (url, body) => {
      try {
        if (typeof fetch === "function") {
          await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event,
              data: body,
              sentAt: new Date().toISOString(),
            }),
          });
        } else {
          console.log("Webhook not sent (no fetch available):", url);
        }
      } catch (err) {
        console.error("⚠ Webhook POST error:", err.message);
      }
    };

    const cleanPayload = {
      event,
      paymentId: payload._id,
      status: payload.status,
      method: payload.method,
      totalAmount: payload.totalAmount,
      companyId: payload.companyId,
      driverId: payload.driverId,
      customerId: payload.customerId,
      tripId: payload.tripId,
      createdAt: payload.createdAt,
      paidAt: payload.paidAt,
    };

    await Promise.all(webhooks.map((wh) => doPost(wh.url, cleanPayload)));
  } catch (err) {
    console.error("⚠ triggerPaymentWebhooks error:", err.message);
  }
};

/* ==========================================================
   Helper: notify related users about payment status
========================================================== */
const notifyPaymentStatus = async ({ req, payment, trip, status }) => {
  try {
    const populatedTrip = trip
      ? trip
      : await getPopulatedTripForNotify(payment.tripId);

    const payloadCommon = {
      paymentId: payment._id,
      tripId: payment.tripId,
      status: payment.status,
      totalAmount: payment.totalAmount,
      method: payment.method,
      driver: populatedTrip?.driverId,
      customer: populatedTrip?.customerId,
      company: populatedTrip?.companyId,
    };

    const titleBase =
      status === "paid"
        ? "Payment Successful"
        : status === "pending"
        ? "Payment Pending"
        : status === "failed"
        ? "Payment Failed"
        : status === "refunded"
        ? "Payment Refunded"
        : "Payment Updated";

    const messageBase =
      status === "paid"
        ? "Your payment has been completed."
        : status === "pending"
        ? "Your payment is pending confirmation."
        : status === "failed"
        ? "Your payment attempt has failed."
        : status === "refunded"
        ? "Your payment has been refunded."
        : "Your payment status has been updated.";

    // Customer notification
    if (payment.customerId) {
      await createNotification(req, {
        userId: payment.customerId,
        title: titleBase,
        message: messageBase,
        type: "payment",
        category: "customer",
        relatedTripId: payment.tripId,
        actionUrl: `/customer/payments/${payment._id}`,
        extraData: payloadCommon,
      });
    }

    // Driver notification
    if (payment.driverId) {
      await createNotification(req, {
        userId: payment.driverId,
        title: titleBase,
        message: `Payment update for one of your trips: ${status}.`,
        type: "payment",
        category: "driver",
        relatedTripId: payment.tripId,
        actionUrl: `/driver/trips/${payment.tripId}`,
        extraData: payloadCommon,
      });
    }

    // Company / manager notification
    if (payment.companyId) {
      await createNotification(req, {
        userId: payment.companyId,
        title: titleBase,
        message: `Payment status updated to "${status}".`,
        type: "payment",
        category: "company",
        relatedTripId: payment.tripId,
        actionUrl: `/company/payments/${payment._id}`,
        extraData: payloadCommon,
      });
    }
  } catch (err) {
    console.error("⚠ notifyPaymentStatus error:", err.message);
  }
};

/* ==========================================================
   💰 CREATE PAYMENT (manual or gateway callback)
========================================================== */
export const createPayment = async (req, res) => {
  try {
    // ✅ Validate & clean body
    const { error, value } = createPaymentSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: "Invalid payment data",
        details: error.details.map((d) => d.message),
      });
    }

    // Sanitize string fields
    value.method = sanitize(value.method);
    if (value.status) value.status = sanitize(value.status);
    if (value.transactionId) {
      value.transactionId = sanitize(value.transactionId);
    }
    if (value.currency) {
      value.currency = sanitize(value.currency);
    }

    const {
      tripId,
      method,
      status,
      totalAmount,
      deliveryFee,
      productTotal,
      discountAmount,
      taxAmount,
      gatewayFee,
      transactionId,
      gatewayResponse,
      currency,
    } = value;

    if (!isValidObjectId(tripId)) {
      return res.status(400).json({ error: "Invalid tripId format" });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Prevent duplicate "active" payments for same trip
    const existing = await Payment.findOne({
      tripId,
      status: { $in: ["pending", "paid"] },
    });

    if (existing) {
      return res.status(400).json({
        error: "An active payment already exists for this trip.",
      });
    }

    const companyId = trip.companyId;
    const driverId = trip.driverId || null;
    const customerId = trip.customerId || null;

    const earningResult = await computeAdvancedEarnings({
      trip,
      companyUserId: companyId,
      overrides: {
        totalAmount,
        deliveryFee,
        productTotal,
        discountAmount,
        taxAmount,
        gatewayFee,
        currency,
      },
    });

    const payment = await Payment.create({
      tripId,
      companyId,
      driverId,
      customerId,

      totalAmount: earningResult.totalAmount,
      deliveryFee: earningResult.deliveryFee,
      productTotal: earningResult.productTotal,
      discountAmount: earningResult.discountAmount,
      taxAmount: earningResult.taxAmount,
      gatewayFee: earningResult.gatewayFee,
      currency: earningResult.currency,

      driverEarning: earningResult.driverEarning,
      companyEarning: earningResult.companyEarning,
      platformEarning: earningResult.platformEarning,

      paymentBreakdown: earningResult.paymentBreakdown,

      method,
      status,
      transactionId: transactionId || null,
      gatewayResponse: gatewayResponse || {},
      isPlatformFeeApplied: false,

      paidAt: status === "paid" ? new Date() : null,
      createdBy: req.user?._id || null,
      isActive: true,
      meta: {},
    });

    // 🔔 Notifications
    await notifyPaymentStatus({
      req,
      payment,
      trip,
      status: payment.status,
    });

    // 🌐 Webhooks
    await triggerPaymentWebhooks(companyId, "payment.created", payment);
    if (payment.status === "paid") {
      await triggerPaymentWebhooks(companyId, "payment.paid", payment);
    } else if (payment.status === "pending") {
      await triggerPaymentWebhooks(companyId, "payment.pending", payment);
    } else if (payment.status === "failed") {
      await triggerPaymentWebhooks(companyId, "payment.failed", payment);
    }

    res.status(201).json({
      ok: true,
      message: "Payment created successfully",
      payment,
    });
  } catch (err) {
    console.error("❌ createPayment error:", err.message);
    res.status(500).json({ error: "Server error creating payment" });
  }
};

/* ==========================================================
   💸 REFUND PAYMENT (Owner / Superadmin)
========================================================== */
export const refundPayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid payment id" });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.status !== "paid") {
      return res.status(400).json({
        error: "Only paid payments can be refunded.",
      });
    }

    payment.status = "refunded";
    payment.isActive = false;
    await payment.save();

    const trip = await Trip.findById(payment.tripId);

    // 🔔 Notifications
    await notifyPaymentStatus({
      req,
      payment,
      trip,
      status: "refunded",
    });

    // 🌐 Webhook
    await triggerPaymentWebhooks(payment.companyId, "payment.refunded", payment);

    res.json({
      ok: true,
      message: "Payment refunded successfully",
      payment,
    });
  } catch (err) {
    console.error("❌ refundPayment error:", err.message);
    res.status(500).json({ error: "Server error refunding payment" });
  }
};

/* ==========================================================
   📊 GET COMPANY PAYMENTS
========================================================== */
export const getCompanyPayments = async (req, res) => {
  try {
    const {
      error,
      value: validatedQuery,
    } = paginationQuerySchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: false,
    });

    if (error) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: error.details.map((d) => d.message),
      });
    }

    const companyIdFromUser = resolveCompanyIdFromUser(req.user);
    const {
      status,
      method,
      startDate,
      endDate,
      page,
      limit,
      companyId: queryCompanyId,
    } = validatedQuery;

    if (
      !companyIdFromUser &&
      !["owner", "superadmin"].includes(req.user.role)
    ) {
      return res.status(400).json({
        error: "Unable to resolve companyId for this user.",
      });
    }

    const filter = {};

    if (req.user.role === "company" || req.user.role === "manager") {
      filter.companyId = companyIdFromUser;
    } else if (
      ["owner", "superadmin"].includes(req.user.role) &&
      queryCompanyId
    ) {
      if (!isValidObjectId(queryCompanyId)) {
        return res.status(400).json({ error: "Invalid companyId format" });
      }
      filter.companyId = queryCompanyId;
    }

    if (status) filter.status = status;
    if (method) filter.method = method;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [total, payments] = await Promise.all([
      Payment.countDocuments(filter),
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("driverId", "name email")
        .populate("customerId", "name email")
        .populate("tripId", "_id status deliveryFee"),
    ]);

    res.json({
      ok: true,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
      payments,
    });
  } catch (err) {
    console.error("❌ getCompanyPayments error:", err.message);
    res.status(500).json({ error: "Server error fetching company payments" });
  }
};

/* ==========================================================
   👨‍✈️ GET DRIVER PAYMENTS
========================================================== */
export const getDriverPayments = async (req, res) => {
  try {
    const {
      error,
      value: validatedQuery,
    } = paginationQuerySchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: false,
    });

    if (error) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: error.details.map((d) => d.message),
      });
    }

    const { status, startDate, endDate, page, limit, driverId: queryDriverId } =
      validatedQuery;

    const driverId =
      req.user.role === "driver" ? req.user._id : queryDriverId;

    if (!driverId || !isValidObjectId(driverId)) {
      return res
        .status(400)
        .json({ error: "driverId is required and must be valid" });
    }

    const filter = { driverId };

    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [total, payments] = await Promise.all([
      Payment.countDocuments(filter),
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("companyId", "name email")
        .populate("customerId", "name email")
        .populate("tripId", "_id status deliveryFee"),
    ]);

    res.json({
      ok: true,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
      payments,
    });
  } catch (err) {
    console.error("❌ getDriverPayments error:", err.message);
    res.status(500).json({ error: "Server error fetching driver payments" });
  }
};

/* ==========================================================
   👤 GET CUSTOMER PAYMENTS
========================================================== */
export const getCustomerPayments = async (req, res) => {
  try {
    const {
      error,
      value: validatedQuery,
    } = paginationQuerySchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: false,
    });

    if (error) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: error.details.map((d) => d.message),
      });
    }

    const { status, startDate, endDate, page, limit } = validatedQuery;
    const customerId = req.user._id;

    const filter = { customerId };

    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [total, payments] = await Promise.all([
      Payment.countDocuments(filter),
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("companyId", "name email")
        .populate("driverId", "name email")
        .populate("tripId", "_id status deliveryFee"),
    ]);

    res.json({
      ok: true,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
      payments,
    });
  } catch (err) {
    console.error("❌ getCustomerPayments error:", err.message);
    res.status(500).json({ error: "Server error fetching customer payments" });
  }
};

/* ==========================================================
   🔎 GET SINGLE PAYMENT DETAILS
========================================================== */
export const getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid payment id" });
    }

    const payment = await Payment.findById(id)
      .populate("companyId", "name email")
      .populate("driverId", "name email")
      .populate("customerId", "name email")
      .populate("tripId");

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const user = req.user;

    if (
      user.role === "driver" &&
      String(payment.driverId) !== String(user._id)
    ) {
      return res
        .status(403)
        .json({ error: "Not allowed to view this payment" });
    }

    if (
      user.role === "customer" &&
      String(payment.customerId) !== String(user._id)
    ) {
      return res
        .status(403)
        .json({ error: "Not allowed to view this payment" });
    }

    if (user.role === "company" || user.role === "manager") {
      const companyId = resolveCompanyIdFromUser(user);
      if (
        String(payment.companyId?._id || payment.companyId) !==
        String(companyId)
      ) {
        return res
          .status(403)
          .json({ error: "Not allowed to view this payment" });
      }
    }

    // owner/superadmin can see everything
    res.json({
      ok: true,
      payment,
    });
  } catch (err) {
    console.error("❌ getPaymentDetails error:", err.message);
    res.status(500).json({ error: "Server error loading payment details" });
  }
};

/* ==========================================================
   📊 COMPANY PAYMENTS SUMMARY (for dashboard)
========================================================== */
export const getCompanyPaymentsSummary = async (req, res) => {
  try {
    const { error, value } = paginationQuerySchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: false,
    });

    if (error) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: error.details.map((d) => d.message),
      });
    }

    const user = req.user;
    const { startDate, endDate, companyId: queryCompanyId } = value;

    let companyId = resolveCompanyIdFromUser(user);

    if (
      ["owner", "superadmin"].includes(user.role) &&
      queryCompanyId
    ) {
      if (!isValidObjectId(queryCompanyId)) {
        return res.status(400).json({ error: "Invalid companyId format" });
      }
      companyId = queryCompanyId;
    }

    if (!companyId) {
      return res.status(400).json({
        error: "Unable to resolve companyId for payments summary",
      });
    }

    const match = {
      companyId,
      status: "paid",
    };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const [summary] = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalDeliveryFees: { $sum: "$deliveryFee" },
          totalProductTotal: { $sum: "$productTotal" },
          totalDriverEarning: { $sum: "$driverEarning" },
          totalCompanyEarning: { $sum: "$companyEarning" },
          totalPlatformEarning: { $sum: "$platformEarning" },
        },
      },
    ]);

    res.json({
      ok: true,
      summary:
        summary || {
          totalPayments: 0,
          totalAmount: 0,
          totalDeliveryFees: 0,
          totalProductTotal: 0,
          totalDriverEarning: 0,
          totalCompanyEarning: 0,
          totalPlatformEarning: 0,
        },
    });
  } catch (err) {
    console.error("❌ getCompanyPaymentsSummary error:", err.message);
    res.status(500).json({
      error: "Server error calculating payments summary",
    });
  }
};
