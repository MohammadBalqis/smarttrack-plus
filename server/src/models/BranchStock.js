// server/src/models/BranchStock.js
import mongoose from "mongoose";

/* ==========================================================
   🏪 BRANCH / SHOP STOCK
   - Tracks product quantity per shop
========================================================== */
const branchStockSchema = new mongoose.Schema(
  {
    /* ------------------------------------------------------
       🏪 SHOP (Branch)
    ------------------------------------------------------ */
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    /* ------------------------------------------------------
       📦 PRODUCT
    ------------------------------------------------------ */
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    /* ------------------------------------------------------
       📊 QUANTITY
    ------------------------------------------------------ */
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ------------------------------------------------------
       📜 STOCK HISTORY (OPTIONAL, PER SHOP)
    ------------------------------------------------------ */
    history: [
      {
        change: { type: Number, required: true },
        reason: { type: String, default: "" },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

/* ==========================================================
   🔒 UNIQUE CONSTRAINT
   One document per (shop + product)
========================================================== */
branchStockSchema.index(
  { shopId: 1, productId: 1 },
  { unique: true }
);

/* ==========================================================
   EXPORT
========================================================== */
const BranchStock = mongoose.model("BranchStock", branchStockSchema);
export default BranchStock;
