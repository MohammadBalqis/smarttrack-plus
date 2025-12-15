import mongoose from "mongoose";

/* ==========================================================
   🏪 SHOP / BRANCH
========================================================== */
const shopSchema = new mongoose.Schema(
  {
    /* ======================================================
       🔗 COMPANY RELATION
    ====================================================== */
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // role: company
      required: true,
      index: true,
    },

    /* ======================================================
       👤 CURRENT MANAGER (EDITABLE)
       - Can be null
       - Can be replaced if manager quits
    ====================================================== */
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // role: manager
      default: null,
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
       (for live tracking / nearest logic)
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
       📊 CACHED STATS (OPTIONAL BUT POWERFUL)
       - keeps UI fast
       - updated when drivers are added/removed
    ====================================================== */
    driversCount: {
      type: Number,
      default: 0,
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
shopSchema.index({ companyId: 1, managerId: 1 });

/* ==========================================================
   🧠 VIRTUALS
   (optional – useful later)
========================================================== */
shopSchema.virtual("hasManager").get(function () {
  return !!this.managerId;
});

/* ==========================================================
   EXPORT
========================================================== */
const Shop = mongoose.model("Shop", shopSchema);
export default Shop;
