// server.js — FINAL, CLEAN, WORKING (Option 2: Auth-only limiters)

import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import compression from "compression";
import cors from "cors";

/* ==========================================================
   ENV & APP
========================================================== */
dotenv.config();
const app = express();

/* ==========================================================
   🔐 SECURITY MIDDLEWARES
========================================================== */
import { sanitizeRequest } from "./src/middleware/sanitizeMiddleware.js";
import { applySecurityMiddlewares } from "./src/middleware/securityMiddleware.js";
import { loginLimiter } from "./src/middleware/loginRateLimit.js";
import { registerLimiter } from "./src/middleware/registerRateLimit.js";

/* ==========================================================
   🔧 BASE MIDDLEWARE
========================================================== */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-session-id"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(morgan("dev"));

applySecurityMiddlewares(app);
app.use(sanitizeRequest);

/* 🔐 RATE LIMIT ONLY AUTH (✅ SAFE) */
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", registerLimiter);

/* 🔒 Extra security */
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(compression());

/* ==========================================================
   📁 STATIC FILES
========================================================== */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ==========================================================
   🔗 ROUTES IMPORT
========================================================== */

/* Auth & Public */
import authRoutes from "./src/routes/authRoutes.js";
import publicCompanyRegisterRoutes from "./src/routes/publicCompanyRegisterRoutes.js";

/* ===== SYSTEM OWNER ===== */
import systemOwnerRoutes from "./src/routes/systemOwnerRoutes.js";
import systemOwnerCompanyApplicationsRoutes from "./src/routes/systemOwnerCompanyApplicationsRoutes.js";
import systemOwnerSettingsRoutes from "./src/routes/systemOwnerSettingsRoutes.js";
import systemOwnerActivityRoutes from "./src/routes/systemOwnerActivityRoutes.js";

/* ===== COMPANY ===== */
import companyRoutes from "./src/routes/companyRoutes.js";
import companyDashboardRoutes from "./src/routes/companyDashboardRoutes.js";
import companyTripsRoutes from "./src/routes/companyTripsRoutes.js";
import companyCustomerRoutes from "./src/routes/companyCustomerRoutes.js";
import companyProductRoutes from "./src/routes/companyProductRoutes.js";
import companyVehicleRoutes from "./src/routes/companyVehicleRoutes.js";
import companyOrdersRoutes from "./src/routes/companyOrderRoutes.js";
import companyDriverRoutes from "./src/routes/companyDriverRoutes.js";
import companyPaymentRoutes from "./src/routes/companyPaymentRoutes.js";
import companyBrandingRoutes from "./src/routes/companyBrandingRoutes.js";
import companySettingsRoutes from "./src/routes/companySettingsRoutes.js";

/* ===== MANAGER ===== */
import managerDashboardRoutes from "./src/routes/managerDashboardRoutes.js";
import managerDriverRoutes from "./src/routes/managerDriverRoutes.js";
import managerVehicleRoutes from "./src/routes/managerVehicleRoutes.js";
import managerTripRoutes from "./src/routes/managerTripRoutes.js";
import managerCustomerRoutes from "./src/routes/managerCustomerRoutes.js";
import managerOrderRoutes from "./src/routes/managerOrdersRoutes.js";
import managerNotificationRoutes from "./src/routes/managerNotificationRoutes.js";
import managerProfileRoutes from "./src/routes/managerProfileRoutes.js";
import managerPaymentsRoutes from "./src/routes/managerPaymentsRoutes.js";
import managerLiveRoutes from "./src/routes/managerLiveRoutes.js";
import managerShopProductsRoutes from "./src/routes/managerShopProductsRoutes.js";

/* ===== DRIVER ===== */
import driverRoutes from "./src/routes/driverRoutes.js";
import driverTripRoutes from "./src/routes/driverTripRoutes.js";
import driverNotificationRoutes from "./src/routes/driverNotificationRoutes.js";

/* ===== CUSTOMER ===== */
import customerRoutes from "./src/routes/customerRoutes.js";
import customerTripRoutes from "./src/routes/customerTripRoutes.js";
import customerPaymentRoutes from "./src/routes/customerPaymentRoutes.js";
import customerSettingsRoutes from "./src/routes/customerSettingsRoutes.js";

/* ===== SHARED ===== */
import productRoutes from "./src/routes/productRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import invoiceRoutes from "./src/routes/invoiceRoutes.js";
import globalSettingsRoutes from "./src/routes/globalSettingsRoutes.js";
import billingSettingsRoutes from "./src/routes/billingSettingsRoutes.js";
import sessionRoutes from "./src/routes/sessionRoutes.js";
import supportRoutes from "./src/routes/supportRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import qrRoutes from "./src/routes/qrRoutes.js";

/* ==========================================================
   📌 REGISTER ROUTES
========================================================== */

/* Auth */
app.use("/api/auth", authRoutes);

/* 🔓 PUBLIC COMPANY REGISTRATION (NO LIMITER HERE) */
app.use("/api", publicCompanyRegisterRoutes);

/* 🔑 SYSTEM OWNER */
app.use("/api/owner", systemOwnerRoutes);
app.use("/api/owner/settings", systemOwnerSettingsRoutes);
app.use("/api/owner/activity", systemOwnerActivityRoutes);
app.use("/api/owner/companies", systemOwnerCompanyApplicationsRoutes);

/* Company */
app.use("/api/company", companyRoutes);
app.use("/api/company/dashboard", companyDashboardRoutes);
app.use("/api/company/trips", companyTripsRoutes);
app.use("/api/company/customers", companyCustomerRoutes);
app.use("/api/company/products", companyProductRoutes);
app.use("/api/company/vehicles", companyVehicleRoutes);
app.use("/api/company/orders", companyOrdersRoutes);
app.use("/api/company/drivers", companyDriverRoutes);
app.use("/api/company/payments", companyPaymentRoutes);
app.use("/api/company/branding", companyBrandingRoutes);
app.use("/api/company/settings", companySettingsRoutes);

/* Manager */
app.use("/api/manager/dashboard", managerDashboardRoutes);
app.use("/api/manager/drivers", managerDriverRoutes);
app.use("/api/manager/vehicles", managerVehicleRoutes);
app.use("/api/manager/trips", managerTripRoutes);
app.use("/api/manager/customers", managerCustomerRoutes);
app.use("/api/manager/orders", managerOrderRoutes);
app.use("/api/manager/notifications", managerNotificationRoutes);
app.use("/api/manager/profile", managerProfileRoutes);
app.use("/api/manager/payments", managerPaymentsRoutes);
app.use("/api/manager/live", managerLiveRoutes);
app.use("/api/manager/shop-products", managerShopProductsRoutes);

/* Driver */
app.use("/api/driver", driverRoutes);
app.use("/api/driver/trips", driverTripRoutes);
app.use("/api/driver/notifications", driverNotificationRoutes);

/* Customer */
app.use("/api/customer/profile", customerRoutes);
app.use("/api/customer/trips", customerTripRoutes);
app.use("/api/customer/payments", customerPaymentRoutes);
app.use("/api/customer/settings", customerSettingsRoutes);

/* Shared */
app.use("/api/products", productRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/settings", globalSettingsRoutes);
app.use("/api/billing-settings", billingSettingsRoutes);
app.use("/api/sessions", sessionRoutes);

/* Support & Chat */
app.use("/api", supportRoutes);
app.use("/api", chatRoutes);

/* QR */
app.use("/api/qr", qrRoutes);

/* ==========================================================
   🩺 HEALTH CHECK
========================================================== */
app.get("/api/health", (req, res) => {
  res.json({ status: "SmartTrack API is running ✔" });
});

/* ==========================================================
   🗄 DB
========================================================== */
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected ✔");
};

/* ==========================================================
   🔌 SOCKET.IO
========================================================== */
const server = http.createServer(app);

export const io = new Server(server, {
  cors: { origin: "*" },
  pingTimeout: 30000,
});

app.set("io", io);

/* ==========================================================
   🚀 START
========================================================== */
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 SmartTrack backend running on port ${PORT}`);
});
