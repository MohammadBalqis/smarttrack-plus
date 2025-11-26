import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Product basic info
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    price: { type: Number, required: true, min: 0 },

    // Unified category (for system-wide filtering)
    category: {
      type: String,
      enum: [
        "restaurant",
        "water",
        "fuel",
        "electronics",
        "clothes",
        "books",
        "machines",
        "general",
      ],
      default: "general",
    },

    // Dynamic attributes (optional)
    attributes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Optional product images
    images: [{ type: String }],

    /* ==========================================================
       📦 INVENTORY STOCK (NEW)
       ========================================================== */
    stock: {
      type: Number,
      default: 0,  // default empty
      min: 0,
    },

    // Active/inactive status
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
