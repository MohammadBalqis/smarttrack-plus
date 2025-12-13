// client/src/pages/systemOwner/OwnerActivityLogs.jsx
import React, { useEffect, useState } from "react";
import { getOwnerActivityLogsApi } from "../../api/ownerApi";
import styles from "../../styles/systemOwner/activityLogs.module.css";

const OwnerActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [actionFilter, setActionFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");

  const loadLogs = async (pageValue = 1) => {
    try {
      setLoading(true);
      setError("");

      const res = await getOwnerActivityLogsApi({
        page: pageValue,
        limit: 25,
        action: actionFilter || undefined,
        email: emailFilter || undefined,
      });

      setLogs(res.data.logs || []);
      setPage(res.data.page || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Owner activity logs error:", err);
      setError("Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadLogs(1);
  };

  const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString() : "-";

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Activity Logs</h1>
          <p className={styles.subtitle}>
            Security and audit trail for all actions in SmartTrack+.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshBtn}
          onClick={() => loadLogs(page)}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* Filters */}
      <form className={styles.filterBar} onSubmit={handleFilterSubmit}>
        <div className={styles.filterGroup}>
          <label>Action</label>
          <input
            type="text"
            placeholder="LOGIN, REGISTER, CREATE_TRIP..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>User email</label>
          <input
            type="text"
            placeholder="user@example.com"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
          />
        </div>
        <button type="submit" className={styles.filterBtn} disabled={loading}>
          Apply
        </button>
      </form>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.tableCard}>
        {logs.length === 0 ? (
          <div className={styles.emptyBox}>No activity recorded yet.</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>IP / Device</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>{formatDateTime(log.createdAt)}</td>
                    <td>
                      <div className={styles.userCell}>
                        <span>{log.userId?.name || "Unknown"}</span>
                        <span className={styles.userEmail}>
                          {log.userId?.email || "—"}
                        </span>
                      </div>
                    </td>
                    <td>{log.userId?.role || "—"}</td>
                    <td>
                      <span className={styles.actionBadge}>{log.action}</span>
                    </td>
                    <td className={styles.descriptionCol}>
                      {log.description || "—"}
                    </td>
                    <td className={styles.metaCol}>
                      <div>{log.ipAddress || "—"}</div>
                      {log.deviceInfo && (
                        <div className={styles.deviceInfo}>
                          {log.deviceInfo}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* pagination */}
        <div className={styles.pagination}>
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => loadLogs(page - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => loadLogs(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerActivityLogs;
