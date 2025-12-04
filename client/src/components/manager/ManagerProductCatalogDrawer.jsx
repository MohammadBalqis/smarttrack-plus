// client/src/components/manager/ManagerProductCatalogDrawer.jsx
import React, { useEffect, useState } from "react";
import {
  getManagerGlobalProductsApi,
  addManagerProductFromCompanyApi,
} from "../../api/managerProductsApi";
import styles from "../../styles/manager/managerProductDrawer.module.css";

const ManagerProductCatalogDrawer = ({ open, onClose, onProductAdded }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [error, setError] = useState("");

  const loadCatalog = async () => {
    if (!open) return;
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;

      const res = await getManagerGlobalProductsApi(params);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("Error loading catalog:", err);
      setError("Failed to load company catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCatalog();
  };

  const handleAddToShop = async (baseProduct) => {
    try {
      setAddingId(baseProduct._id);
      setError("");

      const payload = {
        // Manager can adjust after adding; we start with base price
        price: baseProduct.price ?? 0,
        stock: 0,
        isActive: true,
      };

      const res = await addManagerProductFromCompanyApi(
        baseProduct._id,
        payload
      );

      if (res.data?.ok && onProductAdded) {
        onProductAdded(res.data.product);
      }
    } catch (err) {
      console.error("Error adding product to shop:", err);
      setError(
        err.response?.data?.error ||
          "Failed to add product to your shop. Please try again."
      );
    } finally {
      setAddingId(null);
    }
  };

  const formatPrice = (v) => {
    if (typeof v === "number") return `$${v.toFixed(2)}`;
    const n = Number(v || 0);
    return `$${n.toFixed(2)}`;
  };

  return (
    <div
      className={`${styles.drawerOverlay} ${open ? styles.open : ""}`}
      onClick={onClose}
    >
      <div
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <h2>Company Catalog</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div className={styles.drawerContent}>
          <div className={styles.filtersRow}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              <option value="restaurant">Restaurant</option>
              <option value="water">Water</option>
              <option value="fuel">Fuel</option>
              <option value="electronics">Electronics</option>
              <option value="clothes">Clothes</option>
              <option value="books">Books</option>
              <option value="machines">Machines</option>
              <option value="general">General</option>
            </select>

            <form
              onSubmit={handleSearchSubmit}
              className={styles.searchRow}
            >
              <input
                type="text"
                placeholder="Search product name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>
          </div>

          {loading && <p className={styles.smallInfo}>Loading catalog…</p>}
          {error && <p className={styles.error}>{error}</p>}

          {!loading && products.length === 0 ? (
            <p className={styles.empty}>
              No products in the company catalog yet.
            </p>
          ) : (
            <div className={styles.list}>
              {products.map((p) => (
                <div key={p._id} className={styles.productRow}>
                  <div className={styles.productMain}>
                    {Array.isArray(p.images) && p.images.length > 0 ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className={styles.thumbnail}
                      />
                    ) : (
                      <div className={styles.noImage}>No Image</div>
                    )}

                    <div>
                      <div className={styles.productName}>{p.name}</div>
                      <div className={styles.productMeta}>
                        <span>{p.category || "general"}</span>
                        <span>{formatPrice(p.price)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => handleAddToShop(p)}
                    disabled={addingId === p._id}
                  >
                    {addingId === p._id ? "Adding..." : "Add to my shop"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerProductCatalogDrawer;
