import React, { useEffect, useState } from "react";
import {
  updateManagerProductStockApi,
  updateManagerProductPriceApi,
  toggleManagerProductApi,
} from "../../api/managerProductsApi";

import styles from "../../styles/manager/managerProductDrawer.module.css";

const ManagerProductDrawer = ({ open, onClose, product, onUpdated }) => {
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [discount, setDiscount] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  /* ==========================================================
     LOAD INITIAL VALUES (ShopProduct)
  ========================================================== */
  useEffect(() => {
    if (!product) return;

    setPrice(
      typeof product.price === "number" ? product.price.toString() : ""
    );
    setStock(
      typeof product.stock === "number" ? product.stock.toString() : ""
    );
    setDiscount(
      typeof product.discount === "number"
        ? product.discount.toString()
        : ""
    );
    setIsActive(product.isActive !== false);
  }, [product]);

  if (!open || !product) return null;

  /* ==========================================================
     SAVE HANDLER
  ========================================================== */
  const handleSave = async () => {
    try {
      setLoading(true);

      // 1️⃣ Update price / discount
      await updateManagerProductPriceApi(product.id, {
        price: Number(price) || 0,
        discount: Number(discount) || 0,
      });

      // 2️⃣ Update stock
      await updateManagerProductStockApi(product.id, Number(stock) || 0);

      // 3️⃣ Toggle active if changed
      if (product.isActive !== isActive) {
        await toggleManagerProductApi(product.id);
      }

      if (typeof onUpdated === "function") {
        await onUpdated();
      }

      onClose();
    } catch (err) {
      console.error("❌ Failed to update shop product:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     UI
  ========================================================== */
  const mainImage = product.product?.image || null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className={styles.header}>
          <div>
            <h2>Manage Product</h2>
            <p>Adjust price, stock and status for this shop</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* PRODUCT INFO */}
        <div className={styles.productInfo}>
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.product?.name}
              className={styles.productImage}
            />
          ) : (
            <div className={styles.noImage}>No Image</div>
          )}

          <div className={styles.productMeta}>
            <h3>{product.product?.name}</h3>
            <p className={styles.category}>
              Category: {product.product?.category || "general"}
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className={styles.formSection}>
          <label>Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className={styles.formSection}>
          <label>Discount (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>

        <div className={styles.formSection}>
          <label>Stock</label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>

        <div className={styles.formSectionRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Product is active in this shop
          </label>
        </div>

        {/* ACTIONS */}
        <div className={styles.actions}>
          <button
            className={styles.secondary}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className={styles.primary}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerProductDrawer;
