// client/src/pages/company/CompanyProducts.jsx
import React, { useEffect, useState } from "react";
import {
  createProductApi,
  getCompanyProductsApi,
  updateProductApi,
  toggleProductActiveApi,
  deleteProductApi,
} from "../../api/productApi";

import styles from "../../styles/company/products.module.css";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "general",
  productImage: "",
};

const categoryOptions = [
  { value: "general", label: "General" },
  { value: "restaurant", label: "Restaurant / Food" },
  { value: "water", label: "Water Delivery" },
  { value: "fuel", label: "Fuel Delivery" },
  { value: "electronics", label: "Electronics" },
  { value: "clothes", label: "Clothes" },
  { value: "books", label: "Books" },
  { value: "machines", label: "Machines / Equipment" },
];

const CompanyProducts = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCompanyProductsApi();
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttributeChange = (index, field, value) => {
    setAttributes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addAttributeRow = () => {
    setAttributes((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeAttributeRow = (index) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const buildAttributesObject = () => {
    const obj = {};
    attributes.forEach((attr) => {
      if (attr.key.trim() && attr.value.trim()) {
        obj[attr.key.trim()] = attr.value.trim();
      }
    });
    return obj;
  };

  const resetForm = () => {
    setForm(emptyForm);
    setAttributes([{ key: "", value: "" }]);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,
        price: Number(form.price),
        attributes: buildAttributesObject(),
      };

      // Optional: don’t send empty image
      if (!payload.productImage) delete payload.productImage;

      if (!editingId) {
        // Create
        const res = await createProductApi(payload);
        setProducts((prev) => [res.data.product, ...prev]);
      } else {
        // Update
        const res = await updateProductApi(editingId, payload);
        setProducts((prev) =>
          prev.map((p) => (p._id === editingId ? res.data.product : p))
        );
      }

      resetForm();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error ||
        "Failed to save product. Please check your data.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      category: product.category || "general",
      productImage: product.productImage || "",
    });

    const attrsArr = [];
    if (product.attributes) {
      for (const [key, value] of Object.entries(product.attributes)) {
        attrsArr.push({ key, value: String(value) });
      }
    }
    setAttributes(attrsArr.length ? attrsArr : [{ key: "", value: "" }]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await toggleProductActiveApi(id);
      const updated = res.data.product;
      setProducts((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
    } catch (err) {
      console.error(err);
      setError("Failed to toggle product status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product permanently?")) return;
    try {
      await deleteProductApi(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete product.");
    }
  };

  return (
    <div className={styles.companyProductsPage}>
      {/* Header */}
      <div className={styles.companyProductsHeader}>
        <h2>Products</h2>
        <p>Manage the services / items your company offers to customers.</p>
      </div>

      {/* Form Card */}
      <div className={styles.productFormCard}>
        <div className={styles.cardHeaderRow}>
          <h3>{editingId ? "Edit Product" : "Create New Product"}</h3>
          {saving && <span className={styles.smallInfoText}>Saving...</span>}
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.productForm}>
          <div className={styles.formRow}>
            <label>Product Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              className={styles.textInput}
              required
            />
          </div>

          <div className={styles.formRow}>
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              rows={3}
              className={styles.textArea}
            />
          </div>

          <div className={styles.formRow}>
            <label>Price *</label>
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleFormChange}
              className={styles.textInput}
              required
            />
          </div>

          <div className={styles.formRow}>
            <label>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleFormChange}
              className={styles.selectInput}
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <label>Product Image URL (optional)</label>
            <input
              type="text"
              name="productImage"
              value={form.productImage}
              onChange={handleFormChange}
              className={styles.textInput}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Attributes */}
          <div className={styles.formRow}>
            <label>Custom Attributes</label>
            <div className={styles.attributesList}>
              {attributes.map((attr, index) => (
                <div key={index} className={styles.attributeRow}>
                  <input
                    type="text"
                    placeholder="Key (e.g. size, liters, author)"
                    value={attr.key}
                    onChange={(e) =>
                      handleAttributeChange(index, "key", e.target.value)
                    }
                    className={styles.textInput}
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. XL, 20, John Doe)"
                    value={attr.value}
                    onChange={(e) =>
                      handleAttributeChange(index, "value", e.target.value)
                    }
                    className={styles.textInput}
                  />
                  <button
                    type="button"
                    className={styles.attrRemoveBtn}
                    onClick={() => removeAttributeRow(index)}
                    disabled={attributes.length === 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className={styles.attrAddBtn}
              onClick={addAttributeRow}
            >
              + Add Attribute
            </button>
          </div>

          <div className={styles.formActions}>
            {editingId && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={saving}
            >
              {editingId ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className={styles.productsTableCard}>
        <div className={styles.cardHeaderRow}>
          <h3>Products List</h3>
          {loading && (
            <span className={styles.smallInfoText}>Loading products...</span>
          )}
        </div>

        {!loading && products.length === 0 ? (
          <p className={styles.emptyState}>
            No products yet. Start by creating your first product.
          </p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.productsTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Attributes</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td className={styles.productNameCell}>{p.name}</td>
                    <td>{p.category || "general"}</td>
                    <td>
                      {p.attributes &&
                      Object.keys(p.attributes).length > 0 ? (
                        <ul className={styles.attributesListInTable}>
                          {Object.entries(p.attributes).map(
                            ([key, value]) => (
                              <li key={key}>
                                <strong>{key}:</strong> {String(value)}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <span className={styles.mutedText}>—</span>
                      )}
                    </td>
                    <td>${p.price?.toFixed(2)}</td>
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
                        : ""}
                    </td>
                    <td className={styles.actionsCell}>
                      <button
                        type="button"
                        className={styles.tableBtn}
                        onClick={() => handleEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.tableBtn}
                        onClick={() => handleToggleActive(p._id)}
                      >
                        {p.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className={`${styles.tableBtn} ${styles.tableBtnDanger}`}
                        onClick={() => handleDelete(p._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProducts;
