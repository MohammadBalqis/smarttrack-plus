// src/pages/manager/ManagerProducts.jsx
import React, { useEffect, useState } from "react";
import { getCompanyProductsApi } from "../../api/companyProductsApi";
import ManagerProductDrawer from "../../components/manager/ManagerProductDrawer";
import styles from "../../styles/manager/managerProducts.module.css";

const ManagerProducts = () => {
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (search) params.name = search;
      if (category) params.category = category;
      if (status) params.status = status;

      const res = await getCompanyProductsApi(params);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, category, status]);

  const openDrawer = (product) => {
    setSelectedProduct(product);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedProduct(null);
    setDrawerOpen(false);
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>Products</h1>
          <p>Product list for your company (view-only).</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className={styles.filtersRow}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Category */}
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="restaurant">Restaurant</option>
          <option value="water">Water</option>
          <option value="fuel">Fuel</option>
          <option value="electronics">Electronics</option>
          <option value="clothes">Clothes</option>
          <option value="books">Books</option>
          <option value="machines">Machines</option>
          <option value="general">General</option>
        </select>

        {/* Status */}
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* TABLE CARD */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Product List</h3>
          {loading && <span className={styles.smallInfo}>Loading...</span>}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {products.length === 0 && !loading ? (
          <p className={styles.empty}>No products found.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      {p.productImage ? (
                        <img
                          src={p.productImage}
                          alt=""
                          className={styles.thumbnail}
                        />
                      ) : (
                        <div className={styles.noImage}>No Image</div>
                      )}
                    </td>

                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>${p.price.toFixed(2)}</td>

                    <td>
                      <span
                        className={
                          p.isActive
                            ? styles.statusBadgeActive
                            : styles.statusBadgeInactive
                        }
                      >
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>

                    <td>
                      <button
                        className={styles.viewBtn}
                        onClick={() => openDrawer(p)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DRAWER */}
      <ManagerProductDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        product={selectedProduct}
      />
    </div>
  );
};

export default ManagerProducts;
