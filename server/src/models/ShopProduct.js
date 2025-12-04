// server/src/models/ShopProduct.js
import mongoose from "mongoose";

const shopProductSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // company owner
      required: true,
      index: true,
    },

    // shop-specific fields
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    // optional but useful
    discount: { type: Number, default: 0 }, // %
    lowStockAlertSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

shopProductSchema.index({ shopId: 1, productId: 1 }, { unique: true });

const ShopProduct = mongoose.model("ShopProduct", shopProductSchema);
export default ShopProduct;
