// client/src/pages/company/CompanyCustomers.jsx
import React, { useEffect, useState, useContext } from "react";
import {
  getCompanyCustomersApi,
} from "../../api/companyCustomersApi";

import CompanyCustomerDrawer from "../../components/company/CompanyCustomerDrawer";

// 🔵 Branding
import { BrandingContext } from "../../context/BrandingContext";

import styles from "../../styles/company/companyCustomers.module.css";

const CompanyCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Branding system
  const { branding } = useContext(BrandingContext);
  const primary = branding?.primaryColor || "#1F2937";
  const accent = branding?.accentColor || "#2563EB";

  // Filters
  const [search, setSearch] = useState("");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCompanyCustomersApi();
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error("Error loading customers:", err);
      setError("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term)
    );
  });

  const openDrawer = (customer) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedCustomer(null);
    setDrawerOpen(false);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title} style={{ color: primary }}>
            Customers
          </h1>
          <p className={styles.subtitle} style={{ color: accent }}>
            View and analyze customers who ordered from your company.
          </p>
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ borderColor: accent }}
          />
        </div>
      </div>

      {/* Error */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Loading */}
      {loading ? (
        <p>Loading customers...</p>
      ) : filteredCustomers.length === 0 ? (
        <p className={styles.empty}>
          No customers found yet. Customers will appear once they place orders.
        </p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr style={{ background: primary, color: "#fff" }}>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c._id}>
                  <td className={styles.customerCell}>
                    <div className={styles.customerInfo}>
                      {/* Avatar colored by branding */}
                      <div
                        className={styles.avatar}
                        style={{ background: accent }}
                      >
                        {c.name?.charAt(0)?.toUpperCase() || "C"}
                      </div>
                      <span>{c.name}</span>
                    </div>
                  </td>

                  <td>{c.email}</td>
                  <td>{c.phone || "—"}</td>

                  <td>
                    <span
                      className={
                        c.isActive ? styles.statusActive : styles.statusInactive
                      }
                      style={{
                        background: c.isActive ? accent : "#bbb",
                      }}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleDateString()
                      : "—"}
                  </td>

                  <td>
                    <button
                      className={styles.viewButton}
                      style={{ color: primary }}
                      onClick={() => openDrawer(c)}
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

      {/* Drawer */}
      <CompanyCustomerDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        customer={selectedCustomer}
      />
    </div>
  );
};

export default CompanyCustomers;
