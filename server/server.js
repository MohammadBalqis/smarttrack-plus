// server.js (CLEAN, FIXED, SECURE)
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

dotenv.config();
const app = express();

/* ==========================================================
   🔐 SECURITY & RATE LIMIT
========================================================== */
import { sanitizeRequest } from "./src/middleware/sanitizeMiddleware.js";
import { applySecurityMiddlewares } from "./src/middleware/securityMiddleware.js";
import { globalLimiter } from "./src/middleware/globalRateLimit.js";
import { loginLimiter } from "./src/middleware/loginRateLimit.js";
import { registerLimiter } from "./src/middleware/registerRateLimit.js";
import { apiLimiter } from "./src/middleware/rateLimitMiddleware.js";

/* ==========================================================
   🧩 BASE MIDDLEWARE
========================================================== */
app.use(sanitizeRequest);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan("dev"));
applySecurityMiddlewares(app);

app.use(
  helmet.crossOriginResourcePolicy({
    policy: "cross-origin",
  })
);

// Global limiter
app.use(globalLimiter);

// Login/Register limiters
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", registerLimiter);

// Prevent injection
app.use(mongoSanitize());
app.use(xss());

// Performance
app.use(compression());

/* ==========================================================
   📁 STATIC FILES
========================================================== */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ==========================================================
   🔗 ROUTES IMPORTS
========================================================== */
import authRoutes from "./src/routes/authRoutes.js";
import superAdminRoutes from "./src/routes/superAdminRoutes.js";

import companyRoutes from "./src/routes/companyRoutes.js";
import companyDashboardRoutes from "./src/routes/companyDashboardRoutes.js";
import companyTripsRoutes from "./src/routes/companyTripsRoutes.js";
import companyCustomerRoutes from "./src/routes/companyCustomerRoutes.js";
import companyProductRoutes from "./src/routes/companyProductRoutes.js";
import companyVehicleRoutes from "./src/routes/companyVehicleRoutes.js";
import companyPaymentRoutes from "./src/routes/companyPaymentRoutes.js";
import companyDriverRoutes from "./src/routes/companyDriverRoutes.js";
import companyOrdersRoutes from "./src/routes/companyOrdersRoutes.js"; // NEW
import companyBrandingRoutes from "./src/routes/companyBrandingRoutes.js";
import managerDashboardRoutes from "./src/routes/managerDashboardRoutes.js";
import managerDriverRoutes from "./src/routes/managerDriverRoutes.js";
import managerVehicleRoutes from "./src/routes/managerVehicleRoutes.js";
import managerTripRoutes from "./src/routes/managerTripRoutes.js";
import managerCustomerRoutes from "./src/routes/managerCustomerRoutes.js";
import managerOrderRoutes from "./src/routes/managerOrdersRoutes.js";
import managerNotificationRoutes from "./src/routes/managerNotificationRoutes.js";

import driverRoutes from "./src/routes/driverRoutes.js";
import customerRoutes from "./src/routes/customerRoutes.js";
import customerTripRoutes from "./src/routes/customerTripRoutes.js";

import productRoutes from "./src/routes/productRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import invoiceRoutes from "./src/routes/invoiceRoutes.js";

import adminStatsRoutes from "./src/routes/adminStatsRoutes.js";
import globalSettingsRoutes from "./src/routes/globalSettingsRoutes.js";
import brandingRoutes from "./src/routes/brandingRoutes.js";
import billingSettingsRoutes from "./src/routes/billingSettingsRoutes.js";

import publicApiRoutes from "./src/routes/publicApiRoutes.js";
import sessionRoutes from "./src/routes/sessionRoutes.js";

/* ==========================================================
   🌐 PUBLIC ROUTES
========================================================== */
app.use("/api/public", apiLimiter);
app.use("/api/public/company", publicApiRoutes);

/* ==========================================================
   📌 MAIN ROUTES
========================================================== */
// Auth
app.use("/api/auth", authRoutes);

// SuperAdmin
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/admin", adminStatsRoutes);

// Company
app.use("/api/company", companyRoutes);
app.use("/api/company/dashboard", companyDashboardRoutes);
app.use("/api/company/trips", companyTripsRoutes);
app.use("/api/company/customers", companyCustomerRoutes);
app.use("/api/company/products", companyProductRoutes);
app.use("/api/company/vehicles", companyVehicleRoutes);
app.use("/api/company/orders", companyOrdersRoutes);
app.use("/api/company/drivers", companyDriverRoutes);
app.use("/api/company/payments", companyPaymentRoutes);
app.use("/api/company/branding", brandingRoutes);

app.use("/api/company/branding", companyBrandingRoutes);
// Manager
app.use("/api/manager/dashboard", managerDashboardRoutes);
app.use("/api/manager/drivers", managerDriverRoutes);
app.use("/api/manager/vehicles", managerVehicleRoutes);
app.use("/api/manager/trips", managerTripRoutes);
app.use("/api/manager/customers", managerCustomerRoutes);
app.use("/api/manager/orders", managerOrderRoutes);
app.use("/api/manager/notifications", managerNotificationRoutes);

// Driver
app.use("/api/driver", driverRoutes);

// Customer
app.use("/api/customer/profile", customerRoutes);
app.use("/api/customer/trips", customerTripRoutes);

// Shared
app.use("/api/products", productRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/settings", globalSettingsRoutes);
app.use("/api/billing-settings", billingSettingsRoutes);
app.use("/api/sessions", sessionRoutes);

/* ==========================================================
   🌡️ HEALTH CHECK
========================================================== */
app.get("/api/health", (req, res) => {
  res.json({ status: "✅ SmartTrack API is running" });
});

/* ==========================================================
   💾 DB CONNECTION
========================================================== */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

/* ==========================================================
   🔌 SOCKET.IO
========================================================== */
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
  pingTimeout: 30000,
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔵 Socket connected:", socket.id);

  socket.on("register", (userId) => {
    if (userId) socket.join(String(userId));
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

/* ==========================================================
   🚀 START SERVER
========================================================== */
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 SmartTrack Server running on port ${PORT}`);
});
