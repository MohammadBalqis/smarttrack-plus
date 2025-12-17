import React, { useEffect, useState } from "react";
import {
  getCustomerCompaniesApi,
  selectCustomerCompanyApi,
} from "../../api/customerCompanyApi";
import styles from "../../styles/customer/selectCompany.module.css";

const SelectCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [selectingId, setSelectingId] = useState(null);

  /* ==========================================================
     LOAD COMPANIES
  ========================================================== */
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getCustomerCompaniesApi();

        if (res.data?.ok) {
          setCompanies(Array.isArray(res.data.companies) ? res.data.companies : []);
        } else {
          setError("Failed to load companies.");
          setCompanies([]);
        }
      } catch (err) {
        console.error("Load companies error:", err);
        setError("Error loading companies.");
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  /* ==========================================================
     FILTER (SAFE)
  ========================================================== */
  const filteredCompanies = companies.filter((c) => {
    if (!c || !c.name) return false;
    return c.name.toLowerCase().includes(search.toLowerCase());
  });

  /* ==========================================================
     SELECT COMPANY
  ========================================================== */
  const handleSelect = async (companyId) => {
    if (!companyId || selectingId) return;

    setSelectingId(companyId);

    try {
      const res = await selectCustomerCompanyApi(companyId);

      if (res.data?.ok) {
        // hard redirect to reload auth context cleanly
        window.location.href = "/customer";
      } else {
        alert(res.data?.error || "Failed to select company.");
      }
    } catch (err) {
      console.error("Select company error:", err);
      alert("Error selecting company.");
    } finally {
      setSelectingId(null);
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Choose Your Company</h1>
      <p className={styles.subtitle}>
        Select a company to start ordering and tracking deliveries.
      </p>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search companies..."
        className={styles.search}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={loading}
      />

      {loading && <p className={styles.info}>Loading companies...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {/* COMPANY GRID */}
      {!loading && filteredCompanies.length > 0 && (
        <div className={styles.grid}>
          {filteredCompanies.map((c) => (
            <div key={c._id} className={styles.card}>
              <div className={styles.logoBox}>
                {c.logo ? (
                  <img src={c.logo} alt={c.name} className={styles.logo} />
                ) : (
                  <div className={styles.logoPlaceholder}>
                    {c.name?.[0] || "?"}
                  </div>
                )}
              </div>

              <h3 className={styles.companyName}>{c.name}</h3>

              {c.businessCategory && (
                <p className={styles.category}>{c.businessCategory}</p>
              )}

              <button
                className={styles.selectBtn}
                disabled={selectingId === c._id}
                onClick={() => handleSelect(c._id)}
              >
                {selectingId === c._id ? "Selecting..." : "Select"}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredCompanies.length === 0 && !error && (
        <p className={styles.info}>No companies match your search.</p>
      )}
    </div>
  );
};

export default SelectCompany;
