import React, { useEffect, useState } from "react";
import {
  getCompanyProductsApi,
  createCompanyProductApi,
  updateCompanyProductApi,
  toggleCompanyProductActiveApi,
  adjustCompanyProductStockApi,
  getSingleCompanyProductApi,
} from "../../api/companyProductsApi";

import styles from "../../styles/company/companyProducts.module.css";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "general",
  images: [""],
  stock: 0,
  lowStockThreshold: 5,
};

const CompanyProducts = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);

  // filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [page, setPage] = useState(1);
  const limit = 20;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // create/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // stock adjust
  const [stockChange, setStockChange] = useState("");
  const [stockReason, setStockReason] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const params = { page, limit };
      if (categoryFilter) params.category = categoryFilter;
      if (activeFilter) params.active = activeFilter;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (searchTerm) params.search = searchTerm.trim();

      const res = await getCompanyProductsApi(params);
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Load products error:", err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoryFilter, activeFilter, minPrice, maxPrice]);

  const totalPages = Math.ceil(total / limit) || 1;

  /* ---------------- Form helpers ---------------- */

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setStockChange("");
    setStockReason("");
    setModalOpen(true);
    setError("");
  };

  const openEditModal = async (product) => {
    try {
      // optional: get fresh data
      const res = await getSingleCompanyProductApi(product._id);
      const p = res.data.product || product;

      setEditingProduct(p);
      setForm({
        name: p.name || "",
        description: p.description || "",
        price: p.price ?? "",
        category: p.category || "general",
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [""],
        stock: p.stock ?? 0,
        lowStockThreshold: p.lowStockThreshold ?? 5,
      });
      setStockChange("");
      setStockReason("");
      setModalOpen(true);
      setError("");
    } catch (err) {
      console.error("Open edit modal error:", err);
      setError("Failed to load product.");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setStockChange("");
    setStockReason("");
  };

  const handleFormChange = (e, index = null) => {
    const { name, value } = e.target;

    if (name === "image" && index !== null) {
      setForm((prev) => {
        const imgs = [...prev.images];
        imgs[index] = value;
        return { ...prev, images: imgs };
      });
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addImageField = () => {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ""],
    }));
  };

  const removeImageField = (index) => {
    setForm((prev) => {
      const imgs = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: imgs.length ? imgs : [""] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        images: (form.images || []).filter((url) => url.trim() !== ""),
      };

      if (!editingProduct) {
        await createCompanyProductApi(payload);
      } else {
        await updateCompanyProductApi(editingProduct._id, payload);
      }

      closeModal();
      setPage(1);
      await loadProducts();
    } catch (err) {
      console.error("Save product error:", err);
      const msg = err.response?.data?.error || "Failed to save product.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await toggleCompanyProductActiveApi(product._id);
      await loadProducts();
    } catch (err) {
      console.error(err);
      setError("Failed to toggle product status.");
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const delta = Number(stockChange);
    if (!delta) return;

    try {
      await adjustCompanyProductStockApi(
        editingProduct._id,
        delta,
        stockReason
      );
      setStockChange("");
      setStockReason("");
      await loadProducts();
      // re-fetch product for modal
      const res = await getSingleCompanyProductApi(editingProduct._id);
      setEditingProduct(res.data.product);
    } catch (err) {
      console.error("Adjust stock error:", err);
      setError("Failed to adjust stock.");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const getStockBadgeClass = (p) => {
    if (p.stock === 0) return styles.stockBadgeZero;
    if (p.stock <= (p.lowStockThreshold ?? 5)) return styles.stockBadgeLow;
    return styles.stockBadgeOk;
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Products</h1>
          <p>Manage your company&apos;s product catalog and stock.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={openCreateModal}
          >
            + Add Product
          </button>
          <div className={styles.headerStats}>
            <span>Total: {total}</span>
          </div>
        </div>
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
          {loading && <span className={styles.smallInfo}>Loading...</span>}
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
                    <td>${p.price?.toFixed(2) ?? "0.00"}</td>
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
                        className={styles.smallBtn}
                        onClick={() => openEditModal(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() => handleToggleActive(p)}
                      >
                        {p.isActive ? "Deactivate" : "Activate"}
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <label>
                Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                />
              </label>

              <div className={styles.formRow}>
                <label>
                  Price
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="price"
                    value={form.price}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Category
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="water">Water</option>
                    <option value="fuel">Fuel</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothes">Clothes</option>
                    <option value="books">Books</option>
                    <option value="machines">Machines</option>
                    <option value="general">General</option>
                  </select>
                </label>
              </div>

              <div className={styles.formRow}>
                <label>
                  Stock
                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleFormChange}
                  />
                </label>
                <label>
                  Low stock threshold
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={form.lowStockThreshold}
                    onChange={handleFormChange}
                  />
                </label>
              </div>

              <div className={styles.imagesSection}>
                <label>Image URLs</label>
                {form.images.map((url, index) => (
                  <div key={index} className={styles.imageRow}>
                    <input
                      type="text"
                      name="image"
                      value={url}
                      onChange={(e) => handleFormChange(e, index)}
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={addImageField}
                >
                  + Add image
                </button>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeModal}
                  className={styles.secondaryBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>

            {/* Stock adjust block (only when editing) */}
            {editingProduct && (
              <div className={styles.stockAdjustSection}>
                <h3>Adjust Stock</h3>
                <form onSubmit={handleAdjustStock}>
                  <div className={styles.formRow}>
                    <input
                      type="number"
                      value={stockChange}
                      onChange={(e) => setStockChange(e.target.value)}
                      placeholder="+5 or -2"
                    />
                    <input
                      type="text"
                      value={stockReason}
                      onChange={(e) => setStockReason(e.target.value)}
                      placeholder="Reason (optional)"
                    />
                    <button
                      type="submit"
                      className={styles.secondaryBtn}
                      disabled={!stockChange}
                    >
                      Apply
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProducts;
