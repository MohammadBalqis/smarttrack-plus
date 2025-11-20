// client/src/pages/customer/Products.jsx
import React, { useEffect, useState } from "react";
import { getCustomerProductsApi } from "../../api/productApi";
import "../../styles/customer/products.css";

const CustomerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCustomerProductsApi();
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error || "Failed to load products for this company.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="customer-products-page">
      <div className="customer-products-header">
        <h2>Available Products</h2>
        <p>These are the services / items offered by your selected company.</p>
      </div>

      {loading && <p className="info-text">Loading products...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="info-text">No products available at the moment.</p>
      )}

      <div className="products-grid">
        {products.map((p) => (
          <div key={p._id} className="product-card">
            {p.productImage && (
              <div className="product-image-wrapper">
                <img src={p.productImage} alt={p.name} />
              </div>
            )}
            <div className="product-content">
              <h3>{p.name}</h3>
              <p className="product-category">
                {p.category ? p.category.toUpperCase() : "GENERAL"}
              </p>
              {p.description && (
                <p className="product-description">{p.description}</p>
              )}

              {p.attributes && Object.keys(p.attributes).length > 0 && (
                <ul className="product-attributes">
                  {Object.entries(p.attributes).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {String(value)}
                    </li>
                  ))}
                </ul>
              )}

              <div className="product-footer">
                <span className="product-price">${p.price?.toFixed(2)}</span>
                {/* Later you can add "Add to order" button here */}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerProducts;
