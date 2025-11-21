// src/pages/manager/ManagerCustomers.jsx
import React, { useEffect, useState } from "react";
import {
  getCompanyCustomersApi,
} from "../../api/companyCustomersApi";

import ManagerCustomerDrawer from "../../components/manager/ManagerCustomerDrawer";
import styles from "../../styles/manager/managerCustomers.module.css";

const ManagerCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Load customers for THIS company only
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCompanyCustomersApi();
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error("❌ loadCustomers error:", err);
      setError("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openDrawer = (customer) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedCustomer(null);
    setDrawerOpen(false);
  };

  // Search + filter
  const filteredCustomers = customers.filter((c) => {
    const term = search.toLowerCase();
    const matchesSearch =
      c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term);

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && c.isActive) ||
      (statusFilter === "inactive" && !c.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Customers</h1>
          <p>Customers who made orders with your company.</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <input
          type="text"
          placeholder="Search customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Customer List</h3>
          {loading && <span className={styles.smallInfo}>Loading...</span>}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {filteredCustomers.length === 0 && !loading ? (
          <p className={styles.empty}>No customers found.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total Trips</th>
                  <th>Total Spent</th>
                  <th>Status</th>
                  <th>Last Trip</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c.customerId}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phoneNumber || "—"}</td>
                    <td>{c.totalTrips}</td>
                    <td>${c.totalSpent?.toFixed(2) || "0.00"}</td>
                    <td>
                      <span
                        className={
                          c.isActive
                            ? styles.statusBadgeActive
                            : styles.statusBadgeInactive
                        }
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {c.lastTripDate
                        ? new Date(c.lastTripDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <button
                        className={styles.viewBtn}
                        onClick={() => openDrawer(c)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      <ManagerCustomerDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        customer={selectedCustomer}
      />
    </div>
  );
};

export default ManagerCustomers;
