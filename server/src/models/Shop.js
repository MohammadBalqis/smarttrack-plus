// server/src/models/Shop.js
import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    /* ==========================================================
       🔗 RELATION TO COMPANY
       (company user with role: "company")
    ========================================================== */
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ==========================================================
       🏪 BASIC SHOP INFO
    ========================================================== */
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, default: null },

    /* ==========================================================
       📍 LOCATION (FOR MAPS + NEAREST DRIVER LATER)
    ========================================================== */
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    /* ==========================================================
       🕒 SHOP WORKING HOURS
       (optional override per shop)
    ========================================================== */
    workingHours: {
      open: { type: String, default: "08:00" },
      close: { type: String, default: "22:00" },
      timezone: { type: String, default: "Asia/Beirut" },
    },

    /* ==========================================================
       💰 DELIVERY SETTINGS (OPTIONAL PER SHOP)
       If null → use company.settings.deliveryFeeDefault
    ========================================================== */
    deliveryFeeOverride: { type: Number, default: null },
    maxDeliveryDistanceKm: { type: Number, default: null },

    /* ==========================================================
       ⚙️ STATUS
    ========================================================== */
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index to quickly fetch company shops
shopSchema.index({ companyId: 1, isActive: 1 });

const Shop = mongoose.model("Shop", shopSchema);
export default Shop;
