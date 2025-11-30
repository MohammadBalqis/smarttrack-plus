import React, { useEffect, useState } from "react";
import { getCustomerProductsApi } from "../../api/productApi";
import styles from "../../styles/customer/products.module.css";

const CustomerProducts = () => {
  const [products, setProducts] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getCustomerProductsApi();

        if (!res.data.ok) {
          setError("Failed to load products.");
          return;
        }

        setProducts(res.data.products || []);
        setCompanyName(res.data.companyName || "");
      } catch (err) {
        console.error(err);
        setError("Error loading product list.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading products...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (products.length === 0) {
    return (
      <div className={styles.emptyBox}>
        <h2>No Products Found</h2>
        <p>
          This company hasn't added any products yet.  
          Try again later or choose another company.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ------------------------------ */}
      {/* Header */}
      {/* ------------------------------ */}
      <div className={styles.header}>
        <h1>Products</h1>
        {companyName && <p className={styles.sub}>From {companyName}</p>}
      </div>

      {/* ------------------------------ */}
      {/* Grid */}
      {/* ------------------------------ */}
      <div className={styles.grid}>
        {products.map((p) => (
          <div key={p._id} className={styles.card}>
            <div className={styles.imageBox}>
              {p.productImage ? (
                <img src={p.productImage} alt={p.name} />
              ) : (
                <div className={styles.imagePlaceholder}>No Image</div>
              )}
            </div>

            <div className={styles.info}>
              <h3 className={styles.productName}>{p.name}</h3>

              <p className={styles.price}>${p.price?.toFixed(2)}</p>

              {p.description && (
                <p className={styles.description}>{p.description}</p>
              )}

              {p.attributes && Object.keys(p.attributes).length > 0 && (
                <div className={styles.attributes}>
                  {Object.entries(p.attributes).map(([key, val]) => (
                    <div key={key} className={styles.attr}>
                      <span>{key}:</span>
                      <strong>{String(val)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Future: Add to cart */}
              <button className={styles.addBtn}>Add to Cart</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerProducts;
