import React, { useEffect, useMemo, useState } from "react";
import {
  approveOwnerCompanyApplicationApi,
  getOwnerCompanyApplicationsApi,
  rejectOwnerCompanyApplicationApi,
} from "../../api/systemOwnerApprovalApi";

import styles from "../../styles/systemOwner/ownerCompanyApprovals.module.css";

const OwnerApprovals = () => {
  const [status, setStatus] = useState("pending"); // pending | approved | rejected | all
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [pages, setPages] = useState(1);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setInfo("");

      const res = await getOwnerCompanyApplicationsApi({
        status,
        search: search || undefined,
        page,
        limit: 15,
      });

      setApplications(res.data?.applications || []);
      setPages(res.data?.pages || 1);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to load approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const approve = async (id) => {
    try {
      setInfo("Approving...");
      await approveOwnerCompanyApplicationApi(id, "Approved by system owner");
      setInfo("Approved ✅");
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Approve failed.");
    }
  };

  const reject = async (id) => {
    const reason = prompt("Reject reason (required):");
    if (!reason) return;

    try {
      setInfo("Rejecting...");
      await rejectOwnerCompanyApplicationApi(id, reason);
      setInfo("Rejected ✅");
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Reject failed.");
    }
  };

  const canPrev = page > 1;
  const canNext = page < pages;

  const badgeClass = useMemo(() => {
    return (s) => {
      if (s === "approved") return `${styles.badge} ${styles.badgeOk}`;
      if (s === "rejected") return `${styles.badge} ${styles.badgeBad}`;
      return `${styles.badge} ${styles.badgeWarn}`;
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Company Approvals</h1>
          <p className={styles.subtitle}>
            Review company registration applications and approve/reject them.
          </p>
        </div>

        <button className={styles.refreshBtn} onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {(error || info) && (
        <div className={styles.alerts}>
          {error && <div className={styles.errorBox}>{error}</div>}
          {info && <div className={styles.infoBox}>{info}</div>}
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <label className={styles.label}>Status</label>
          <select
            className={styles.select}
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>

        <form className={styles.searchForm} onSubmit={onSearchSubmit}>
          <input
            className={styles.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company name / email / contact..."
          />
          <button className={styles.searchBtn} type="submit">
            Search
          </button>
        </form>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div className={styles.emptyBox}>Loading...</div>
        ) : applications.length === 0 ? (
          <div className={styles.emptyBox}>No applications found.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th className={styles.actionsTh}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className={styles.companyName}>{a.companyName}</div>
                      <div className={styles.muted}>{a.companyEmail}</div>
                    </td>

                    <td>
                      <div>{a.contactName || "—"}</div>
                      <div className={styles.muted}>{a.contactPhone || ""}</div>
                    </td>

                    <td>
                      {a.documentUrl || a.documentPath ? (
                        <a
                          className={styles.docLink}
                          href={a.documentUrl || a.documentPath}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View document
                        </a>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>

                    <td>
                      <span className={badgeClass(a.status)}>{a.status}</span>
                      {a.reviewNote ? (
                        <div className={styles.note}>Note: {a.reviewNote}</div>
                      ) : null}
                    </td>

                    <td>{new Date(a.createdAt).toLocaleDateString()}</td>

                    <td className={styles.actionsCell}>
                      <button
                        className={styles.approveBtn}
                        onClick={() => approve(a._id)}
                        disabled={a.status !== "pending"}
                      >
                        Approve
                      </button>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => reject(a._id)}
                        disabled={a.status !== "pending"}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => p - 1)}
            disabled={!canPrev || loading}
          >
            ← Prev
          </button>
          <span className={styles.pageText}>
            Page {page} / {pages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => p + 1)}
            disabled={!canNext || loading}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerApprovals;
