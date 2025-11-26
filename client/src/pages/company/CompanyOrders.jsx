import React, { useEffect, useState } from "react";
import {
  getCompanyOrdersApi,
  updateCompanyOrderStatusApi,
} from "../../api/companyOrdersApi";
import CompanyOrderDrawer from "../../components/company/CompanyOrderDrawer";
import styles from "../../styles/company/companyOrders.module.css";

const CompanyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = await getCompanyOrdersApi(params);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const openDrawer = (order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedOrder(null);
    setDrawerOpen(false);
  };

  const updateStatus = async (orderId, newStatus) => {
    await updateCompanyOrderStatusApi(orderId, newStatus);
    await loadOrders();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Orders</h1>
        <p>Overview of all customer orders.</p>
      </div>

      <div className={styles.filters}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="assigned">Assigned</option>
          <option value="delivering">Delivering</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className={styles.empty}>No orders found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                  <td>{o.customerId?.name}</td>
                  <td>
                    <span className={styles[`badge_${o.status}`]}>
                      {o.status}
                    </span>
                  </td>
                  <td>${o.total?.toFixed(2)}</td>
                  <td>
                    <button
                      className={styles.viewBtn}
                      onClick={() => openDrawer(o)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CompanyOrderDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        order={selectedOrder}
        updateStatus={updateStatus}
      />
    </div>
  );
};

export default CompanyOrders;
