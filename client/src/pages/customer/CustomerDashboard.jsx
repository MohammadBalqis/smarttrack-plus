import React, { useEffect, useState } from "react";
import {
  getCustomerCompaniesApi,
  selectCustomerCompanyApi,
  getActiveCustomerCompanyApi,
} from "../../api/customerCompanyApi";
import styles from "../../styles/customer/customerDashboard.module.css";

const CustomerDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [companiesRes, activeRes] = await Promise.all([
        getCustomerCompaniesApi(),
        getActiveCustomerCompanyApi(),
      ]);

      setCompanies(companiesRes.data.companies || []);
      if (activeRes.data.ok) {
        setActiveCompany(activeRes.data.company || null);
      } else {
        setActiveCompany(null);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || "Failed to load companies.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelect = async (companyId) => {
    try {
      setSelectingId(companyId);
      setError("");
      await selectCustomerCompanyApi(companyId);
      await loadData();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error || "Failed to select this company.";
      setError(msg);
    } finally {
      setSelectingId("");
    }
  };

  const filtered = companies.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.businessCategory?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>Choose a company to order from</h1>
          <p>
            SmartTrack+ lets you order from any subscribed company. Select one
            and start creating delivery requests.
          </p>
        </div>
        <div className={styles.kpiBox}>
          <span className={styles.kpiLabel}>Total companies</span>
          <span className={styles.kpiValue}>{companies.length}</span>
        </div>
      </div>

      {/* ACTIVE COMPANY BANNER */}
      {activeCompany && (
        <div className={styles.activeBanner}>
          <div>
            <div className={styles.activeLabel}>Current company</div>
            <div className={styles.activeName}>{activeCompany.name}</div>
            {activeCompany.address && (
              <div className={styles.activeAddress}>
                {activeCompany.address}
              </div>
            )}
          </div>
          <div className={styles.activeBadge}>Selected</div>
        </div>
      )}

      {/* SEARCH */}
      <div className={styles.searchRow}>
        <input
          type="text"
          placeholder="Search by name, category, or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loading && <span className={styles.smallInfo}>Loading…</span>}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {/* GRID */}
      {filtered.length === 0 && !loading ? (
        <p className={styles.empty}>No companies available yet.</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((c) => {
            const isActive =
              activeCompany && String(activeCompany._id) === String(c._id);

            return (
              <div key={c._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3>{c.name}</h3>
                    {c.businessCategory && (
                      <span className={styles.category}>
                        {c.businessCategory.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {isActive && <span className={styles.selectedChip}>Active</span>}
                </div>

                {c.address && (
                  <p className={styles.address}>{c.address}</p>
                )}

                <div className={styles.metaRow}>
                  {c.phone && (
                    <span className={styles.metaItem}>📞 {c.phone}</span>
                  )}
                  {c.email && (
                    <span className={styles.metaItem}>✉️ {c.email}</span>
                  )}
                </div>

                <div className={styles.footerRow}>
                  <button
                    type="button"
                    className={styles.selectBtn}
                    onClick={() => handleSelect(c._id)}
                    disabled={selectingId === c._id}
                  >
                    {selectingId === c._id
                      ? "Selecting..."
                      : isActive
                      ? "Selected"
                      : "Select company"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
