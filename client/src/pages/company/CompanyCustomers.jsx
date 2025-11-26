// client/src/pages/company/CompanyCustomers.jsx
import React, { useEffect, useState } from "react";
import {
  getCompanyCustomersApi,
  getCompanyCustomerStatsApi,
  getCompanyCustomerRecentTripsApi,
} from "../../api/companyCustomersApi";

import CompanyCustomerDrawer from "../../components/company/CompanyCustomerDrawer";

import styles from "../../styles/company/companyCustomers.module.css";

const CompanyCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const openDrawer = async (customer) => {
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
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.subtitle}>
            View and analyze customers who ordered from your company.
          </p>
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              <tr>
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
                      <div className={styles.avatar}>
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
                        c.isActive
                          ? styles.statusActive
                          : styles.statusInactive
                      }
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
