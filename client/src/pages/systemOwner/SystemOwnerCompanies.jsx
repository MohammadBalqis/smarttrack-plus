// client/src/pages/owner/OwnerCompanies.jsx
import React, { useEffect, useState } from "react";
import {
  getOwnerCompaniesActivityApi,
} from "../../api/ownerApi";

import {
  getOwnerCompanyDetailsApi,
  updateOwnerCompanySubscriptionApi,
  updateOwnerCompanyStatusApi,
  updateOwnerCompanyLimitsApi,
  deleteOwnerCompanyApi,
} from "../../api/systemOwnerCompaniesApi";

import styles from "../../styles/systemOwner/systemOwnerCompanies.module.css";

const OwnerCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [modalType, setModalType] = useState(""); // "subscription" | "status" | "limits" | "delete"
  const [error, setError] = useState("");

  /* ==========================================================
     LOAD MAIN COMPANY TABLE
  ========================================================== */
  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await getOwnerCompaniesActivityApi();
      setCompanies(res.data?.companies || []);
    } catch (err) {
      console.error("Load companies error:", err);
      setError("Failed to load companies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  /* ==========================================================
     OPEN MODAL (preload company data)
  ========================================================== */
  const openModal = async (companyId, type) => {
    try {
      setError("");
      const res = await getOwnerCompanyDetailsApi(companyId);
      setSelectedCompany(res.data?.company || null);
      setModalType(type);
    } catch (err) {
      console.error("Modal load error:", err);
      setError("Failed to load company details.");
    }
  };

  const closeModal = () => {
    setSelectedCompany(null);
    setModalType("");
  };

  /* ==========================================================
     SUBMIT ACTIONS
  ========================================================== */
  const updateSubscription = async (newPlan) => {
    try {
      await updateOwnerCompanySubscriptionApi(selectedCompany._id, {
        plan: newPlan,
      });
      closeModal();
      loadCompanies();
    } catch (err) {
      setError("Failed to update subscription plan.");
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await updateOwnerCompanyStatusApi(selectedCompany._id, {
        status: newStatus,
      });
      closeModal();
      loadCompanies();
    } catch (err) {
      setError("Failed to update company status.");
    }
  };

  const updateLimits = async (maxDrivers) => {
    try {
      await updateOwnerCompanyLimitsApi(selectedCompany._id, { maxDrivers });
      closeModal();
      loadCompanies();
    } catch (err) {
      setError("Failed to update company limits.");
    }
  };

  const deleteCompany = async () => {
    try {
      await deleteOwnerCompanyApi(selectedCompany._id);
      closeModal();
      loadCompanies();
    } catch (err) {
      setError("Failed to delete company.");
    }
  };

  /* ==========================================================
     RENDER PAGE
  ========================================================== */
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Companies & Subscriptions</h1>
      <p className={styles.subtitle}>
        Manage companies, their subscription plans, driver limits, and status.
      </p>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loading}>Loading companies...</div>
        ) : companies.length === 0 ? (
          <div className={styles.empty}>No companies found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company</th>
                <th>Subscription</th>
                <th>Max Drivers</th>
                <th>Active Drivers</th>
                <th>Trips Today</th>
                <th>Status</th>
                <th className={styles.actionsTh}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {companies.map((c) => (
                <tr key={c.companyId}>
                  <td>
                    <div className={styles.companyName}>{c.name}</div>
                    <div className={styles.companyMeta}>
                      Created: {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td>{c.subscriptionPlan}</td>
                  <td>{c.maxDrivers ?? "—"}</td>
                  <td>{c.activeDrivers}</td>
                  <td>{c.tripsToday}</td>

                  <td>
                    <span
                      className={
                        c.status === "Suspended"
                          ? styles.statusSuspended
                          : styles.statusActive
                      }
                    >
                      {c.status}
                    </span>
                  </td>

                  <td className={styles.actionsCell}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => openModal(c.companyId, "subscription")}
                    >
                      Subscription
                    </button>

                    <button
                      className={styles.actionBtn}
                      onClick={() => openModal(c.companyId, "limits")}
                    >
                      Limits
                    </button>

                    <button
                      className={styles.actionBtn}
                      onClick={() => openModal(c.companyId, "status")}
                    >
                      Status
                    </button>

                    <button
                      className={styles.deleteBtn}
                      onClick={() => openModal(c.companyId, "delete")}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ==========================================================
         MODAL — REUSABLE
      ========================================================== */}
      {modalType && selectedCompany && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            {/* ---- Subscription ---- */}
            {modalType === "subscription" && (
              <>
                <h3>Update Subscription – {selectedCompany.name}</h3>
                <p>Select a subscription tier:</p>

                <div className={styles.modalOptions}>
                  {["50", "80", "100", "150"].map((price) => (
                    <button
                      key={price}
                      className={styles.optionBtn}
                      onClick={() => updateSubscription(price)}
                    >
                      {price}$ / month
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ---- Status ---- */}
            {modalType === "status" && (
              <>
                <h3>Update Status – {selectedCompany.name}</h3>
                <div className={styles.modalOptions}>
                  <button
                    className={styles.optionBtn}
                    onClick={() => updateStatus("active")}
                  >
                    Activate
                  </button>
                  <button
                    className={styles.optionBtn}
                    onClick={() => updateStatus("suspended")}
                  >
                    Suspend
                  </button>
                </div>
              </>
            )}

            {/* ---- Limits ---- */}
            {modalType === "limits" && (
              <>
                <h3>Driver Limit – {selectedCompany.name}</h3>
                <div className={styles.modalOptions}>
                  {[10, 30, 50, 100].map((limit) => (
                    <button
                      key={limit}
                      className={styles.optionBtn}
                      onClick={() => updateLimits(limit)}
                    >
                      Max {limit} Drivers
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ---- Delete ---- */}
            {modalType === "delete" && (
              <>
                <h3>Delete Company</h3>
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{selectedCompany.name}</strong>? This action cannot be
                  undone.
                </p>

                <div className={styles.modalActions}>
                  <button className={styles.deleteBtn} onClick={deleteCompany}>
                    Confirm Delete
                  </button>
                  <button className={styles.cancelBtn} onClick={closeModal}>
                    Cancel
                  </button>
                </div>
              </>
            )}

            <button className={styles.closeBtn} onClick={closeModal}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerCompanies;
