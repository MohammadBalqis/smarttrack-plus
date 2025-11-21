// src/components/manager/ManagerProductDrawer.jsx
import React from "react";
import styles from "../../styles/manager/managerProducts.module.css";

const ManagerProductDrawer = ({ open, onClose, product }) => {
  if (!open || !product) return null;

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        {/* Title */}
        <h2 className={styles.drawerTitle}>Product Details</h2>

        {/* PRODUCT IMAGE */}
        <div className={styles.productImageWrapper}>
          {product.productImage ? (
            <img
              src={product.productImage}
              alt={product.name}
              className={styles.productImage}
            />
          ) : (
            <div className={styles.noImageLarge}>No Image</div>
          )}
        </div>

        {/* BASIC INFO */}
        <div className={styles.infoSection}>
          <h3>{product.name}</h3>
          <p className={styles.categoryText}>
            Category: <strong>{product.category}</strong>
          </p>

          <p className={styles.description}>{product.description || "No description."}</p>

          {/* PRICE */}
          <div className={styles.priceBox}>
            <span>Price:</span>
            <strong>${product.price.toFixed(2)}</strong>
          </div>

          {/* STATUS */}
          <div className={styles.statusRow}>
            <span>Status:</span>
            <span
              className={
                product.isActive
                  ? styles.statusBadgeActive
                  : styles.statusBadgeInactive
              }
            >
              {product.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {/* ATTRIBUTES */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className={styles.section}>
              <h4>Attributes</h4>
              <div className={styles.attributesList}>
                {Object.entries(product.attributes).map(([key, value]) => (
                  <div key={key} className={styles.attributeItem}>
                    <span className={styles.attributeKey}>{key}:</span>
                    <span className={styles.attributeValue}>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TIMESTAMPS */}
          <div className={styles.section}>
            <h4>Metadata</h4>
            <p className={styles.meta}>
              Created: {new Date(product.createdAt).toLocaleString()}
            </p>
            <p className={styles.meta}>
              Updated: {new Date(product.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerProductDrawer;
