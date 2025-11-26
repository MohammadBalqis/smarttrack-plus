// client/src/components/manager/ManagerProductDrawer.jsx
import React from "react";
import styles from "../../styles/manager/managerProducts.module.css";

const ManagerProductDrawer = ({ open, onClose, product }) => {
  if (!open) return null;

  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawer} onClick={stopPropagation}>
        <div className={styles.drawerHeader}>
          <h2>Product Details</h2>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {!product ? (
          <p className={styles.empty}>No product selected.</p>
        ) : (
          <div className={styles.drawerContent}>
            {/* Top info */}
            <div className={styles.drawerMainInfo}>
              <h3 className={styles.drawerTitle}>{product.name}</h3>
              <p className={styles.drawerCategory}>
                Category: <span>{product.category || "general"}</span>
              </p>

              <p className={styles.drawerPrice}>
                Price: <span>${product.price?.toFixed(2) ?? "0.00"}</span>
              </p>

              <p className={styles.drawerStock}>
                Stock:{" "}
                <span
                  className={
                    product.stock === 0
                      ? styles.stockBadgeZero
                      : product.stock <= 5
                      ? styles.stockBadgeLow
                      : styles.stockBadgeOk
                  }
                >
                  {product.stock ?? 0}
                </span>
              </p>

              <p className={styles.drawerStatus}>
                Status:{" "}
                <span
                  className={
                    product.isActive
                      ? styles.statusBadgeActive
                      : styles.statusBadgeInactive
                  }
                >
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div className={styles.drawerSection}>
                <h4>Description</h4>
                <p className={styles.drawerDescription}>
                  {product.description}
                </p>
              </div>
            )}

            {/* Attributes */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className={styles.drawerSection}>
                <h4>Attributes</h4>
                <ul className={styles.attributesList}>
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <li key={key}>
                      <span className={styles.attrKey}>{key}:</span>{" "}
                      <span className={styles.attrValue}>
                        {String(value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Images */}
            {Array.isArray(product.images) && product.images.length > 0 && (
              <div className={styles.drawerSection}>
                <h4>Images</h4>
                <div className={styles.drawerImagesGrid}>
                  {product.images.map((img, index) => (
                    <div key={index} className={styles.drawerImageWrapper}>
                      <img src={img} alt={`${product.name}-${index}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Created / updated */}
            <div className={styles.drawerSection}>
              <h4>Meta</h4>
              <p className={styles.metaLine}>
                Created:{" "}
                {product.createdAt
                  ? new Date(product.createdAt).toLocaleString()
                  : "—"}
              </p>
              <p className={styles.metaLine}>
                Last updated:{" "}
                {product.updatedAt
                  ? new Date(product.updatedAt).toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerProductDrawer;
