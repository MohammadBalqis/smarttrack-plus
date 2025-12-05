// client/src/components/manager/ManagerProductDrawer.jsx
import React, { useEffect, useState } from "react";
import { updateManagerProductApi } from "../../api/managerProductsApi";
import styles from "../../styles/manager/managerProductDrawer.module.css";

const ManagerProductDrawer = ({ open, onClose, product, onUpdated }) => {
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState("");
  const [notes, setNotes] = useState("");
  const [sku, setSku] = useState("");
  const [unit, setUnit] = useState("");
  const [discount, setDiscount] = useState("");
  const [loading, setLoading] = useState(false);

  // Load initial values whenever product changes
  useEffect(() => {
    if (product) {
      setPrice(
        typeof product.price === "number" ? product.price.toString() : ""
      );
      setStock(
        typeof product.stock === "number" ? product.stock.toString() : ""
      );
      setIsActive(product.isActive !== false);
      setLowStockThreshold(
        typeof product.lowStockThreshold === "number"
          ? product.lowStockThreshold.toString()
          : ""
      );
      setNotes(product.notes || "");
      setSku(product.sku || "");
      setUnit(product.unit || "");
      setDiscount(
        typeof product.discountPercentage === "number"
          ? product.discountPercentage.toString()
          : ""
      );
    }
  }, [product]);

  if (!open || !product) return null;

  const handleSave = async () => {
    try {
      setLoading(true);

      const payload = {};

      if (price !== "" && !Number.isNaN(Number(price))) {
        payload.price = Number(price);
      }

      if (stock !== "" && !Number.isNaN(Number(stock))) {
        payload.stock = Number(stock);
      }

      payload.isActive = Boolean(isActive);

      if (
        lowStockThreshold !== "" &&
        !Number.isNaN(Number(lowStockThreshold))
      ) {
        payload.lowStockThreshold = Number(lowStockThreshold);
      }

      if (notes.trim() !== "") {
        payload.notes = notes.trim();
      } else {
        payload.notes = "";
      }

      if (sku.trim() !== "") payload.sku = sku.trim();
      if (unit.trim() !== "") payload.unit = unit.trim();

      if (discount !== "" && !Number.isNaN(Number(discount))) {
        payload.discountPercentage = Number(discount);
      }

      await updateManagerProductApi(product._id, payload);

      if (typeof onUpdated === "function") {
        await onUpdated();
      }

      onClose();
    } catch (err) {
      console.error("Update product failed:", err);
      alert("Failed to update product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const mainImage =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.drawer}>
        {/* HEADER */}
        <div className={styles.header}>
          <div>
            <h2>Manage Product</h2>
            <p>Adjust price, stock, status and thresholds for this shop.</p>
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
              alt={product.name}
              className={styles.productImage}
            />
          ) : (
            <div className={styles.noImage}>No Image</div>
          )}

          <div className={styles.productMeta}>
            <h3>{product.name}</h3>
            <p className={styles.category}>
              Category: {product.category || "general"}
            </p>
            <p className={styles.skuLine}>
              SKU: {product.sku || "—"} | Unit: {product.unit || "—"}
            </p>
            <p className={styles.statusLine}>
              Status:{" "}
              <span
                className={
                  product.isActive ? styles.badgeActive : styles.badgeInactive
                }
              >
                {product.isActive ? "Active" : "Inactive"}
              </span>
            </p>
          </div>
        </div>

        {/* FORM FIELDS */}
        <div className={styles.formSection}>
          <label>Price ($)</label>
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

        <div className={styles.formGrid}>
          <div className={styles.formSection}>
            <label>Stock</label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

          <div className={styles.formSection}>
            <label>Low Stock Threshold</label>
            <input
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formSection}>
            <label>SKU</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>

          <div className={styles.formSection}>
            <label>Unit (kg, L, piece...)</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
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

        <div className={styles.formSection}>
          <label>Internal notes (only you & company see this)</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className={styles.actions}>
          <button
            className={styles.secondary}
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className={styles.primary}
            type="button"
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
