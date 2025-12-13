import React, { useEffect, useState } from "react";
import { getOwnerCompaniesActivityApi } from "../../api/ownerApi";

import {
  getOwnerCompanyDetailsApi,
  updateOwnerCompanySubscriptionApi,
  updateOwnerCompanyStatusApi,
  updateOwnerCompanyLimitsApi,
  deleteOwnerCompanyApi,
  deleteOwnerCompanyPermanentApi, // 🔥 NEW
} from "../../api/systemOwnerCompaniesApi";

import styles from "../../styles/systemOwner/systemOwnerCompanies.module.css";

/* ==========================================================
   SUBSCRIPTION TIERS
========================================================== */
const SUBSCRIPTION_TIERS = [
  { tierKey: "drivers_0_10", label: "0–10 drivers", price: 50 },
  { tierKey: "drivers_11_30", label: "11–30 drivers", price: 80 },
  { tierKey: "drivers_31_50", label: "31–50 drivers", price: 100 },
  { tierKey: "drivers_51_plus", label: "51+ drivers", price: 150 },
];

const OwnerCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [modalType, setModalType] = useState(""); // subscription | status | limits | suspend | delete
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  /* ==========================================================
     LOAD COMPANIES
  ========================================================== */
  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getOwnerCompaniesActivityApi();
      setCompanies(res.data.companies || []);
    } catch {
      setError("Failed to load companies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  /* ==========================================================
     MODAL
  ========================================================== */
  const openModal = async (companyId, type) => {
    try {
      setError("");
      const res = await getOwnerCompanyDetailsApi(companyId);
      setSelectedCompany(res.data.company);
      setModalType(type);
    } catch {
      setError("Failed to load company details.");
    }
  };

  const closeModal = () => {
    setSelectedCompany(null);
    setModalType("");
    setActionLoading(false);
  };

  /* ==========================================================
     ACTIONS
  ========================================================== */
  const updateSubscription = async (tierKey) => {
    try {
      setActionLoading(true);
      await updateOwnerCompanySubscriptionApi(selectedCompany.id, { tierKey });
      await loadCompanies();
      closeModal();
    } catch {
      setError("Failed to update subscription.");
      setActionLoading(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      setActionLoading(true);
      await updateOwnerCompanyStatusApi(selectedCompany.id, { status });
      await loadCompanies();
      closeModal();
    } catch {
      setError("Failed to update company status.");
      setActionLoading(false);
    }
  };

  const updateLimits = async (maxDrivers) => {
    try {
      setActionLoading(true);
      await updateOwnerCompanyLimitsApi(selectedCompany.id, { maxDrivers });
      await loadCompanies();
      closeModal();
    } catch {
      setError("Failed to update limits.");
      setActionLoading(false);
    }
  };

  /* ================== SUSPEND (SOFT DELETE) ================== */
  const suspendCompany = async () => {
    if (!window.confirm("Suspend this company?")) return;

    try {
      setActionLoading(true);
      await deleteOwnerCompanyApi(selectedCompany.id);
      await loadCompanies();
      closeModal();
    } catch {
      setError("Failed to suspend company.");
      setActionLoading(false);
    }
  };

  /* ================== DELETE FOREVER (HARD DELETE) ================== */
  const deleteCompanyForever = async () => {
    const confirm1 = window.confirm(
      "⚠️ This will permanently delete the company AND ALL USERS.\nAre you sure?"
    );
    if (!confirm1) return;

    const confirm2 = window.prompt(
      "Type DELETE to permanently remove this company:"
    );
    if (confirm2 !== "DELETE") return;

    try {
      setActionLoading(true);
      await deleteOwnerCompanyPermanentApi(selectedCompany.id);
      await loadCompanies();
      closeModal();
    } catch {
      setError("Failed to permanently delete company.");
      setActionLoading(false);
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Companies & Subscriptions</h1>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loading}>Loading…</div>
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
                <th />
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.companyId}>
                  <td>
                    <strong>{c.name}</strong>
                    <div>
                      Created:{" "}
                      {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>{c.subscriptionPlan || "—"}</td>
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
                  <td>
                    <button onClick={() => openModal(c.companyId, "subscription")}>
                      Subscription
                    </button>
                    <button onClick={() => openModal(c.companyId, "limits")}>
                      Limits
                    </button>
                    <button onClick={() => openModal(c.companyId, "status")}>
                      Status
                    </button>
                    <button onClick={() => openModal(c.companyId, "suspend")}>
                      Suspend
                    </button>
                    <button
                      className={styles.dangerBtn}
                      onClick={() => openModal(c.companyId, "delete")}
                    >
                      Delete Forever
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {modalType && selectedCompany && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            {modalType === "subscription" &&
              SUBSCRIPTION_TIERS.map((t) => (
                <button
                  key={t.tierKey}
                  disabled={actionLoading}
                  onClick={() => updateSubscription(t.tierKey)}
                >
                  {t.label} — ${t.price}/month
                </button>
              ))}

            {modalType === "status" && (
              <>
                <button onClick={() => updateStatus("active")}>Activate</button>
                <button onClick={() => updateStatus("suspended")}>Suspend</button>
              </>
            )}

            {modalType === "limits" &&
              [10, 30, 50, 100].map((l) => (
                <button key={l} onClick={() => updateLimits(l)}>
                  Max {l} drivers
                </button>
              ))}

            {modalType === "suspend" && (
              <button onClick={suspendCompany}>Confirm Suspend</button>
            )}

            {modalType === "delete" && (
              <button
                className={styles.dangerBtn}
                onClick={deleteCompanyForever}
              >
                DELETE FOREVER
              </button>
            )}

            <button onClick={closeModal}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerCompanies;
