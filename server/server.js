import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import http from "http";                 // Socket.io Requirement
import { Server } from "socket.io";      // Socket.io Requirement

// ROUTES
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


dotenv.config();

const app = express();

/* ==========================================================
   🧩 GLOBAL MIDDLEWARE
   ========================================================== */
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Serve uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ==========================================================
   🚦 API ROUTES
   ========================================================== */
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/manager", managerRoutes);          // Manager main routes
app.use("/api/driver", driverRoutes);
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/trip", tripRoutes);
app.use("/api/trip/analytics", tripAnalyticsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);

app.use("/api/customer/trips", customerTripRoutes);
app.use("/api/company/drivers", companyDriversRoutes);
app.use("/api/customer", customerCompanyRoutes);
app.use("/api/products", productRoutes);

app.use("/api/manager-dashboard", managerDashboardRoutes);

// Manager sub-modules
app.use("/api/manager", managerDriverRoutes);
app.use("/api/manager", managerVehicleRoutes);

// Customer account routes
app.use("/api/customer", customerRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "✅ SmartTrack API is running" });
});

/* ==========================================================
   ⚙️ DATABASE CONNECTION
   ========================================================== */
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/smarttrack"
    );

    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

/* ==========================================================
   🔌 SOCKET.IO SETUP
   ========================================================== */

// Wrap Express app with HTTP server
const server = http.createServer(app);

// Attach Socket.io
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT"]
  }
});

// Socket.io events
io.on("connection", (socket) => {
  console.log("🔵 Socket connected:", socket.id);

  socket.on("register", (userId) => {
    socket.join(userId);
    console.log(`🟢 User ${userId} joined their socket room`);
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
  console.log(`🚀 Server with Socket.io running on port ${PORT}`);
});
