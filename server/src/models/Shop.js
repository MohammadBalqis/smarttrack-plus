// server/src/models/Shop.js
import mongoose from "mongoose";

/* ==========================================================
   🏪 SHOP / BRANCH
========================================================== */
const shopSchema = new mongoose.Schema(
  {
    /* ======================================================
       🔗 COMPANY RELATION
       (User with role: "company")
    ====================================================== */
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ======================================================
       🏪 BASIC INFO
    ====================================================== */
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      default: null,
    },

    /* ======================================================
       📍 GEO LOCATION
       (used for nearest shop / driver later)
    ====================================================== */
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    /* ======================================================
       🕒 WORKING HOURS (OPTIONAL OVERRIDE)
    ====================================================== */
    workingHours: {
      open: { type: String, default: "08:00" },
      close: { type: String, default: "22:00" },
      timezone: { type: String, default: "Asia/Beirut" },
    },

    /* ======================================================
       💰 DELIVERY SETTINGS (PER SHOP)
    ====================================================== */
    deliveryFeeOverride: {
      type: Number,
      default: null,
      min: 0,
    },

    maxDeliveryDistanceKm: {
      type: Number,
      default: null,
      min: 0,
    },

    /* ======================================================
       ⚙️ STATUS
    ====================================================== */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* ==========================================================
   🔎 INDEXES (PERFORMANCE)
========================================================== */
shopSchema.index({ companyId: 1, isActive: 1 });
shopSchema.index({ companyId: 1, city: 1 });

/* ==========================================================
   EXPORT
========================================================== */
const Shop = mongoose.model("Shop", shopSchema);
export default Shop;
