import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
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

    // Flexible structure for company-specific needs
    // Example:
    // attributes: { size: "L", color: "Black" }
    // attributes: { liters: 20, fuelType: "Diesel" }
    attributes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Optional image URL
    images: [{ type: String }],


    // Active/inactive status
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
