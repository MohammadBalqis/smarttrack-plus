// server/src/models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    price: { type: Number, required: true, min: 0 },

    // High-level category (helps UI + filtering)
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

    // Flexible extra fields per company/product
    // Example:
    //  clothes: { size: "L", color: "Black" }
    //  fuel: { type: "Diesel", liters: 20 }
    attributes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Optional product image URL / path
    productImage: { type: String, default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
