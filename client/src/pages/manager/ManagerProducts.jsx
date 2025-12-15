import React, { useEffect, useState } from "react";
import {
  getShopProductsApi,
} from "../../api/managerShopProductsApi";

import ManagerProductDrawer from "../../components/manager/ManagerProductDrawer";
import ManagerProductCatalogDrawer from "../../components/manager/ManagerProductCatalogDrawer";

import styles from "../../styles/manager/managerProducts.module.css";

const ManagerProducts = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Drawers
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

  /* ==========================================================
     LOAD SHOP PRODUCTS (CORRECT SOURCE)
  ========================================================== */
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getShopProductsApi({
        page,
        limit,
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        active: activeFilter || undefined,
      });

      setProducts(res.data.items || []);
      setTotal(res.data.count || 0);
    } catch (err) {
      console.error("❌ Failed to load shop products:", err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoryFilter, activeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const openDrawer = (shopProduct) => {
    setSelectedProduct(shopProduct);
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
    const n = Number(v || 0);
    return `$${n.toFixed(2)}`;
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
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

      {/* SUMMARY */}
      <div className={styles.headerInfoRow}>
        <span>
          Total products: <strong>{total}</strong>
        </span>
        <span>
          Page: <strong>{page}</strong> / {totalPages}
        </span>
      </div>

      {/* FILTERS */}
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

        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {/* TABLE */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Products List</h3>
          {loading && <span className={styles.smallInfo}>Loading...</span>}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {!loading && products.length === 0 ? (
          <p className={styles.empty}>No products in this shop yet.</p>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.product?.image ? (
                        <img
                          src={p.product.image}
                          alt={p.product.name}
                          className={styles.thumbnail}
                        />
                      ) : (
                        <div className={styles.noImage}>No Image</div>
                      )}
                    </td>
                    <td className={styles.nameCell}>
                      {p.product?.name}
                    </td>
                    <td>{p.product?.category || "general"}</td>
                    <td>{formatPrice(p.price)}</td>
                    <td>
                      <span className={getStockBadgeClass(p)}>
                        {p.stock}
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

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className={styles.paginationRow}>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() =>
                setPage((p) => Math.min(totalPages, p + 1))
              }
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* DRAWERS */}
      <ManagerProductDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        product={selectedProduct}
        onUpdated={loadProducts}
      />

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
