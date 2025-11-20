// client/src/pages/company/Products.jsx
import React, { useEffect, useState } from "react";
import {
  createProductApi,
  getCompanyProductsApi,
  updateProductApi,
  toggleProductActiveApi,
  deleteProductApi,
} from "../../api/productApi";
import "../../styles/company/products.css";

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
      if (attr.key.trim() !== "" && attr.value.trim() !== "") {
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

      if (!editingId) {
        // create
        const res = await createProductApi(payload);
        setProducts((prev) => [res.data.product, ...prev]);
      } else {
        // update
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
        "Failed to save product. Please check your input.";
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
    <div className="company-products-page">
      <div className="company-products-header">
        <h2>Products</h2>
        <p>Manage the products your company offers to customers.</p>
      </div>

      <div className="product-form-card">
        <h3>{editingId ? "Edit Product" : "Create New Product"}</h3>
        {error && <div className="product-error">{error}</div>}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-row">
            <label>Product Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              required
            />
          </div>

          <div className="form-row">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              rows={3}
            />
          </div>

          <div className="form-row">
            <label>Price *</label>
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleFormChange}
              required
            />
          </div>

          <div className="form-row">
            <label>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleFormChange}
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Product Image URL (optional)</label>
            <input
              type="text"
              name="productImage"
              value={form.productImage}
              onChange={handleFormChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="form-row">
            <label>Custom Attributes</label>
            <div className="attributes-list">
              {attributes.map((attr, index) => (
                <div key={index} className="attribute-row">
                  <input
                    type="text"
                    placeholder="Key (e.g. size, liters, author)"
                    value={attr.key}
                    onChange={(e) =>
                      handleAttributeChange(index, "key", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. XL, 20, John Doe)"
                    value={attr.value}
                    onChange={(e) =>
                      handleAttributeChange(index, "value", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="attr-remove-btn"
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
              className="attr-add-btn"
              onClick={addAttributeRow}
            >
              + Add Attribute
            </button>
          </div>

          <div className="form-actions">
            {editingId && (
              <button
                type="button"
                className="secondary-btn"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving
                ? editingId
                  ? "Saving..."
                  : "Creating..."
                : editingId
                ? "Save Changes"
                : "Create Product"}
            </button>
          </div>
        </form>
      </div>

      <div className="products-table-card">
        <div className="table-header">
          <h3>Products List</h3>
          {loading && <span className="table-loading">Loading...</span>}
        </div>

        {products.length === 0 ? (
          <p className="empty-state">No products yet. Create your first one.</p>
        ) : (
          <div className="table-wrapper">
            <table className="products-table">
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
                    <td>{p.name}</td>
                    <td>{p.category || "general"}</td>
                    <td className="attributes-cell">
                      {p.attributes && Object.keys(p.attributes).length > 0 ? (
                        <ul>
                          {Object.entries(p.attributes).map(
                            ([key, value]) => (
                              <li key={key}>
                                <strong>{key}:</strong> {String(value)}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <span className="no-attributes">—</span>
                      )}
                    </td>
                    <td>${p.price?.toFixed(2)}</td>
                    <td>
                      <span
                        className={
                          p.isActive ? "status-badge active" : "status-badge inactive"
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
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="table-btn"
                        onClick={() => handleEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="table-btn"
                        onClick={() => handleToggleActive(p._id)}
                      >
                        {p.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className="table-btn danger"
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
