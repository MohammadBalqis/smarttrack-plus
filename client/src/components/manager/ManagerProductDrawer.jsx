// client/src/components/manager/ManagerProductDrawer.jsx
import React, { useState, useEffect } from "react";
import {
  updateShopProductPriceApi,
  updateShopProductStockApi,
  toggleShopProductApi,
} from "../../api/managerShopProductsApi";

import styles from "../../styles/manager/managerProductDrawer.module.css";

const ManagerProductDrawer = ({ open, onClose, item, reload }) => {
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(false);

  // Load initial values when drawer opens
  useEffect(() => {
    if (item) {
      setPrice(item.price ?? "");
      setDiscount(item.discount ?? 0);
      setStock(item.stock ?? "");
    }
  }, [item]);

  if (!open || !item) return null;

  const handleUpdatePrice = async () => {
    try {
      setLoading(true);
      await updateShopProductPriceApi(item.id, Number(price), Number(discount));
      reload();
      onClose();
    } catch (err) {
      console.error("Update price failed:", err);
      alert("Failed to update price");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    try {
      setLoading(true);
      await updateShopProductStockApi(item.id, Number(stock));
      reload();
      onClose();
    } catch (err) {
      console.error("Update stock failed:", err);
      alert("Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      setLoading(true);
      await toggleShopProductApi(item.id);
      reload();
      onClose();
    } catch (err) {
      console.error("Toggle failed:", err);
      alert("Failed to toggle product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.drawer}>
      <div className={styles.content}>
        {/* HEADER */}
        <div className={styles.header}>
          <h2>Manage Product</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* PRODUCT INFO */}
        <div className={styles.productInfo}>
          {item.product?.image ? (
            <img src={item.product.image} alt={item.product.name} />
          ) : (
            <div className={styles.noImage}>No Image</div>
          )}

          <div>
            <h3>{item.product?.name}</h3>
            <p>Category: {item.product?.category}</p>
            <p>Status: {item.isActive ? "Active" : "Inactive"}</p>
          </div>
        </div>

        {/* PRICE */}
        <div className={styles.section}>
          <label>Shop Price ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        {/* DISCOUNT */}
        <div className={styles.section}>
          <label>Discount (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>

        {/* STOCK */}
        <div className={styles.section}>
          <label>Stock</label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className={styles.actions}>
          <button onClick={handleUpdatePrice} disabled={loading}>
            Update Price
          </button>

          <button onClick={handleUpdateStock} disabled={loading}>
            Update Stock
          </button>

          <button
            className={item.isActive ? styles.deactivate : styles.activate}
            onClick={handleToggleActive}
            disabled={loading}
          >
            {item.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerProductDrawer;
