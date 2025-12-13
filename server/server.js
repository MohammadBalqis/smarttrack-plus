// server.js — FINAL, CLEAN, WORKING (SmartTrack+)

import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";

/* ==========================================================
   ENV
========================================================== */
dotenv.config();

/* ==========================================================
   APP
========================================================== */
const app = express();

/* ==========================================================
   BASE MIDDLEWARE
========================================================== */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(morgan("dev"));

/* ==========================================================
   SECURITY
========================================================== */
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(compression());

/* ==========================================================
   STATIC FILES
========================================================== */
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

/* ==========================================================
   ROUTES IMPORT
========================================================== */

/* Auth */
import authRoutes from "./src/routes/authRoutes.js";

/* Public company registration */
import publicCompanyRegisterRoutes from "./src/routes/publicCompanyRegisterRoutes.js";

/* (OPTIONAL – keep if you already use them later) */
import systemOwnerRoutes from "./src/routes/systemOwnerRoutes.js";
import companyRoutes from "./src/routes/companyRoutes.js";

/* ==========================================================
   ROUTES MOUNT
========================================================== */

/* Auth */
app.use("/api/auth", authRoutes);

/* ✅ PUBLIC COMPANY REGISTER
   POST /api/company/register
*/
app.use("/api", publicCompanyRegisterRoutes);

/* Protected / future routes */
app.use("/api/owner", systemOwnerRoutes);
app.use("/api/company", companyRoutes);

/* ==========================================================
   HEALTH CHECK
========================================================== */
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    status: "SmartTrack API is running 🚀",
  });
});

/* ==========================================================
   DATABASE
========================================================== */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
};

/* ==========================================================
   SOCKET.IO
========================================================== */
const server = http.createServer(app);

export const io = new Server(server, {
  cors: { origin: "*" },
  pingTimeout: 30000,
});

app.set("io", io);

/* ==========================================================
   START SERVER
========================================================== */
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 SmartTrack backend running on port ${PORT}`);
});
