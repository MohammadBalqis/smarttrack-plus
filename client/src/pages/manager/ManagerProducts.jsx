// client/src/pages/manager/ManagerProducts.jsx
import React, { useEffect, useState } from "react";
import {
  getManagerProductsApi,
  getManagerProductApi,
} from "../../api/managerProductsApi";
import ManagerProductDrawer from "../../components/manager/ManagerProductDrawer";
import ManagerProductCatalogDrawer from "../../components/manager/ManagerProductCatalogDrawer";
import styles from "../../styles/manager/managerProducts.module.css";

const ManagerProducts = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState(""); // "", "true", "false"
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Drawer (product details)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Drawer (company catalog)
  const [catalogOpen, setCatalogOpen] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit,
      };

      if (categoryFilter) params.category = categoryFilter;
      if (activeFilter) params.active = activeFilter;
      if (searchTerm) params.search = searchTerm.trim();
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const res = await getManagerProductsApi(params);

      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoryFilter, activeFilter, minPrice, maxPrice]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const openDrawer = async (product) => {
    try {
      const res = await getManagerProductApi(product._id);
      setSelectedProduct(res.data.product || product);
    } catch (err) {
      console.error("Error loading product:", err);
      setSelectedProduct(product);
    }
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedProduct(null);
    setDrawerOpen(false);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const getStockBadgeClass = (p) => {
    if (p.stock === 0) return styles.stockBadgeZero;
    if (p.stock <= 5) return styles.stockBadgeLow;
    return styles.stockBadgeOk;
  };

  const formatPrice = (v) => {
    if (typeof v === "number") return `$${v.toFixed(2)}`;
    const num = Number(v || 0);
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Products</h1>
          <p>View and manage products available in your shop.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setCatalogOpen(true)}
          >
            + Add from company catalog
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className={styles.headerInfoRow}>
        <span>
          Total products: <strong>{total}</strong>
        </span>
        <span>
          Page: <strong>{page}</strong> / {Math.max(totalPages, 1)}
        </span>
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
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

        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <input
          type="number"
          min="0"
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />

        <input
          type="number"
          min="0"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />

        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Products List</h3>
          {loading && (
            <span className={styles.smallInfo}>Loading products...</span>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {!loading && products.length === 0 ? (
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
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      {Array.isArray(p.images) && p.images.length > 0 ? (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className={styles.thumbnail}
                        />
                      ) : (
                        <div className={styles.noImage}>No Image</div>
                      )}
                    </td>
                    <td className={styles.nameCell}>{p.name}</td>
                    <td>{p.category || "general"}</td>
                    <td>{formatPrice(p.price)}</td>
                    <td>
                      <span className={getStockBadgeClass(p)}>
                        {p.stock ?? 0}
                      </span>
                    </td>
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
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.viewButton}
                        onClick={() => openDrawer(p)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.paginationRow}>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((prev) => (prev < totalPages ? prev + 1 : prev))
              }
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Product Details Drawer */}
      <ManagerProductDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        product={selectedProduct}
      />

      {/* Company Catalog Drawer */}
      <ManagerProductCatalogDrawer
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onProductAdded={() => {
          setCatalogOpen(false);
          loadProducts();
        }}
      />
    </div>
  );
};

export default ManagerProducts;
