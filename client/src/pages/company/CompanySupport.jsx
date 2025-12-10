// client/src/pages/company/CompanySupport.jsx
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

import styles from "../../styles/company/companySupport.module.css";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
];

const CompanySupport = () => {
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [filteredStatus, setFilteredStatus] = useState("open");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  /* ============================
     Load all support messages
  ============================ */
  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/company/support/messages");
      setMessages(res.data.data || []);
      if (!selected && res.data.data?.length) {
        setSelected(res.data.data[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load support messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  /* ============================
     Socket: listen for new support
  ============================ */
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(import.meta.env.VITE_API_URL);

    socket.emit("register", {
      userId: user._id,
      role: user.role,
      companyId: user._id, // company role
    });

    socket.on("support:new", (msg) => {
      setMessages((prev) => [msg, ...prev]);
      // auto-select newest if nothing selected
      setSelected((current) => current || msg);
    });

    return () => socket.disconnect();
  }, [user]);

  /* ============================
     Derived: filtered list
  ============================ */
  const visibleMessages =
    filteredStatus === "all"
      ? messages
      : messages.filter((m) => m.status === filteredStatus);

  /* ============================
     Update status (open→reviewed/resolved)
  ============================ */
  const updateStatus = async (status) => {
    if (!selected) return;
    try {
      setUpdating(true);
      setError("");
      const res = await api.patch(
        `/company/support/${selected._id}/status`,
        { status }
      );
      const updated = res.data.data;

      setMessages((prev) =>
        prev.map((m) => (m._id === updated._id ? updated : m))
      );
      setSelected(updated);
    } catch (err) {
      console.error(err);
      setError("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Customer Support Inbox</h1>
          <p className={styles.subtitle}>
            View and manage messages sent by your customers.
          </p>
        </div>

        <div className={styles.filters}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilteredStatus(opt.value)}
              className={
                filteredStatus === opt.value
                  ? `${styles.filterBtn} ${styles.filterBtnActive}`
                  : styles.filterBtn
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        {/* LEFT: LIST */}
        <section className={styles.listPanel}>
          {loading ? (
            <div className={styles.empty}>Loading support messages…</div>
          ) : visibleMessages.length === 0 ? (
            <div className={styles.empty}>No messages found.</div>
          ) : (
            visibleMessages.map((msg) => (
              <button
                key={msg._id}
                className={
                  selected?._id === msg._id
                    ? `${styles.listItem} ${styles.listItemActive}`
                    : styles.listItem
                }
                onClick={() => setSelected(msg)}
              >
                <div className={styles.listPrimaryRow}>
                  <span className={styles.customerName}>
                    {msg.customerId?.fullName || "Unknown customer"}
                  </span>
                  <span className={`${styles.status} ${styles[`status_${msg.status}`]}`}>
                    {msg.status}
                  </span>
                </div>
                <div className={styles.listSecondaryRow}>
                  <span className={styles.preview}>
                    {msg.message?.slice(0, 70) || ""}
                    {msg.message?.length > 70 ? "…" : ""}
                  </span>
                  <span className={styles.time}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
              </button>
            ))
          )}
        </section>

        {/* RIGHT: DETAILS */}
        <section className={styles.detailPanel}>
          {!selected ? (
            <div className={styles.detailEmpty}>
              Select a support message to view details.
            </div>
          ) : (
            <>
              <header className={styles.detailHeader}>
                <div>
                  <h2 className={styles.detailTitle}>
                    {selected.customerId?.fullName || "Customer"}
                  </h2>
                  <p className={styles.detailMeta}>
                    {selected.customerId?.phone && (
                      <span>Phone: {selected.customerId.phone} • </span>
                    )}
                    {selected.customerId?.email && (
                      <span>Email: {selected.customerId.email}</span>
                    )}
                  </p>
                </div>

                <span
                  className={`${styles.statusBadge} ${
                    styles[`status_${selected.status}`]
                  }`}
                >
                  {selected.status}
                </span>
              </header>

              <div className={styles.detailBody}>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Message</h3>
                  <p className={styles.messageText}>{selected.message}</p>
                </div>

                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Context</h3>
                  <div className={styles.contextGrid}>
                    <div>
                      <span className={styles.contextLabel}>Created at</span>
                      <span className={styles.contextValue}>
                        {new Date(selected.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {selected.tripId && (
                      <div>
                        <span className={styles.contextLabel}>Trip ID</span>
                        <span className={styles.contextValue}>
                          {selected.tripId}
                        </span>
                      </div>
                    )}
                    {selected.orderId && (
                      <div>
                        <span className={styles.contextLabel}>Order ID</span>
                        <span className={styles.contextValue}>
                          {selected.orderId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <footer className={styles.detailFooter}>
                <button
                  disabled={updating || selected.status === "reviewed"}
                  className={styles.secondaryBtn}
                  onClick={() => updateStatus("reviewed")}
                >
                  Mark as Reviewed
                </button>
                <button
                  disabled={updating || selected.status === "resolved"}
                  className={styles.primaryBtn}
                  onClick={() => updateStatus("resolved")}
                >
                  Mark as Resolved
                </button>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default CompanySupport;
