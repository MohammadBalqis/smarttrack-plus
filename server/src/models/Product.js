// server/src/models/Product.js
import mongoose from "mongoose";

/* ==========================================================
   📜 STOCK HISTORY (AUDIT LOG)
========================================================== */
const stockHistorySchema = new mongoose.Schema(
  {
    change: {
      type: Number, // +5 / -3
      required: true,
    },
    reason: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/* ==========================================================
   📦 PRODUCT
========================================================== */
const productSchema = new mongoose.Schema(
  {
    /* ================= COMPANY ================= */
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ================= BASIC INFO ================= */
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    /* ================= CATEGORY ================= */
   // Product category (company-defined, free text)
category: {
  type: String,
  trim: true,
  default: "",
},


    /* ================= ATTRIBUTES ================= */
    attributes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /* ================= IMAGES ================= */
    images: {
      type: [String],
      default: [],
    },

    /* ================= INVENTORY ================= */

    // Total company-wide stock
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Low-stock alert threshold
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },

    // Stock history for audit & analytics
    stockHistory: {
      type: [stockHistorySchema],
      default: [],
    },

    /* ================= STATUS ================= */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ==========================================================
   🔎 INDEXES FOR ANALYTICS & DASHBOARDS
========================================================== */
productSchema.index({ companyId: 1, createdAt: -1 });
productSchema.index({ companyId: 1, category: 1 });
productSchema.index({ companyId: 1, stock: 1 });

/* ==========================================================
   ⚠️ VIRTUAL: LOW STOCK FLAG
========================================================== */
productSchema.virtual("isLowStock").get(function () {
  return this.stock <= this.lowStockThreshold;
});

/* ==========================================================
   EXPORT
========================================================== */
const Product = mongoose.model("Product", productSchema);
export default Product;
