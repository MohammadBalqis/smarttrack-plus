import React, { useEffect, useState } from "react";
import { getCustomerProductsApi } from "../../api/productApi";
import styles from "../../styles/customer/products.module.css";

const CustomerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getCustomerProductsApi();
        if (res.data.ok) {
          setProducts(res.data.products || []);
        } else {
          setError("Failed to load products.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load products.");
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
    return <div className={styles.errorText}>{error}</div>;
  }

  if (!products.length) {
    return (
      <div className={styles.empty}>
        No products available for this company at the moment.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Available Products</h1>

      <div className={styles.grid}>
        {products.map((p) => (
          <div key={p._id} className={styles.card}>
            <div className={styles.imageWrapper}>
              {p.productImage ? (
                <img
                  src={p.productImage}
                  alt={p.name}
                  className={styles.image}
                />
              ) : (
                <div className={styles.placeholder}>No Image</div>
              )}
            </div>

            <div className={styles.info}>
              <h3 className={styles.productName}>{p.name}</h3>
              {p.description && (
                <p className={styles.desc}>{p.description}</p>
              )}

              <p className={styles.price}>${p.price?.toFixed(2)}</p>

              {p.attributes && Object.keys(p.attributes).length > 0 && (
                <div className={styles.attributes}>
                  {Object.entries(p.attributes).map(([key, value]) => (
                    <div key={key} className={styles.attrItem}>
                      <span className={styles.attrName}>{key}:</span>
                      <span className={styles.attrValue}>
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* later: use this button to create order */}
            <button className={styles.selectBtn}>Select</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerProducts;
