// server.js (FINAL SECURITY-HARDENED VERSION)

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

import { applySecurityMiddlewares } from "./src/middleware/securityMiddleware.js";
import { apiLimiter } from "./src/middleware/rateLimitMiddleware.js";

// Models
import GlobalSettings from "./src/models/GlobalSettings.js";

dotenv.config();
const app = express();

/* ==========================================================
   🧩 BASE MIDDLEWARE (Logging + Body Parsing)
========================================================== */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan("dev"));

/* ==========================================================
   🔐 GLOBAL SECURITY MIDDLEWARES
========================================================== */
applySecurityMiddlewares(app);

app.use(
  helmet.crossOriginResourcePolicy({
    policy: "cross-origin",
  })
);

/* ==========================================================
   🚀 PERFORMANCE BOOST
========================================================== */
app.use(compression());

/* ==========================================================
   🚦 PREVENT MONGO INJECTION & XSS
========================================================== */
app.use(mongoSanitize());
app.use(xss());

/* ==========================================================
   🌍 STATIC FILES
========================================================== */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ==========================================================
   🔗 ROUTES
========================================================== */
import authRoutes from "./src/routes/authRoutes.js";
import companyRoutes from "./src/routes/companyRoutes.js";
import managerRoutes from "./src/routes/managerRoutes.js";
import driverRoutes from "./src/routes/driverRoutes.js";
import vehicleRoutes from "./src/routes/vehicleRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import maintenanceRoutes from "./src/routes/maintenanceRoutes.js";
import tripRoutes from "./src/routes/tripRoutes.js";
import tripAnalyticsRoutes from "./src/routes/tripAnalyticsRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import customerTripRoutes from "./src/routes/customerTripRoutes.js";
import companyDriversRoutes from "./src/routes/companyDriversRoutes.js";
import customerCompanyRoutes from "./src/routes/customerCompanyRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import managerDashboardRoutes from "./src/routes/managerDashboardRoutes.js";
import managerDriverRoutes from "./src/routes/managerDriverRoutes.js";
import managerVehicleRoutes from "./src/routes/managerVehicleRoutes.js";
import customerRoutes from "./src/routes/customerRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import superAdminRoutes from "./src/routes/superAdminRoutes.js";
import globalSettingsRoutes from "./src/routes/globalSettingsRoutes.js";
import billingSettingsRoutes from "./src/routes/billingSettingsRoutes.js";
import invoiceRoutes from "./src/routes/invoiceRoutes.js";
import brandingRoutes from "./src/routes/brandingRoutes.js";
import publicApiRoutes from "./src/routes/publicApiRoutes.js";
import companyDashboardRoutes from "./src/routes/companyDashboardRoutes.js";
import adminStatsRoutes from "./src/routes/adminStatsRoutes.js";
import companyDriverRoutes from "./src/routes/companyDriverRoutes.js";
import companyTripsRoutes from "./src/routes/companyTripsRoutes.js";
import companyCustomerRoutes from "./src/routes/companyCustomerRoutes.js";
import companyProductRoutes from "./src/routes/companyProductRoutes.js";
import companyVehicleRoutes from "./src/routes/companyVehicleRoutes.js";
import sessionRoutes from "./src/routes/sessionRoutes.js";
/* ==========================================================
   🌐 PUBLIC API (Rate Limited)
========================================================== */
app.use("/api/public", apiLimiter);
app.use("/api/public/company", publicApiRoutes);

/* ==========================================================
   📌 MAIN ROUTES
========================================================== */
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/trip", tripRoutes);
app.use("/api/trip/analytics", tripAnalyticsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/settings", globalSettingsRoutes);
app.use("/api/company/branding", brandingRoutes);
app.use("/api/customer/trips", customerTripRoutes);
app.use("/api/company/drivers", companyDriversRoutes);
app.use("/api/customer", customerCompanyRoutes);
app.use("/api/products", productRoutes);
app.use("/api/billing-settings", billingSettingsRoutes);
app.use("/api/manager-dashboard", managerDashboardRoutes);
app.use("/api/manager/drivers", managerDriverRoutes);
app.use("/api/manager/vehicles", managerVehicleRoutes);
app.use("/api/customer/profile", customerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/company/dashboard", companyDashboardRoutes);
app.use("/api/company/trips", companyTripsRoutes);
app.use("/api/company/customers", companyCustomerRoutes);
app.use("/api/company/drivers", companyDriverRoutes);
app.use("/api/admin", adminStatsRoutes);
app.use("/api/company/products", companyProductRoutes);
app.use("/api/company/vehicles", companyVehicleRoutes);
app.use("/api/sessions", sessionRoutes);
/* ==========================================================
   🌡️ HEALTH CHECK
========================================================== */
app.get("/api/health", (req, res) => {
  res.json({ status: "✅ SmartTrack API is running" });
});

/* ==========================================================
   💾 DATABASE CONNECTION
========================================================== */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

/* ==========================================================
   🔌 SOCKET.IO SETUP (HARDENED)
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
