import React, { useEffect, useState } from "react";
import { getCustomerCompaniesApi, selectCompanyApi } from "../../api/customerCompaniesApi";
import styles from "../../styles/customer/selectCompany.module.css";

const SelectCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getCustomerCompaniesApi();
        if (res.data.ok) {
          setCompanies(res.data.companies);
        } else {
          setError("Failed to load companies.");
        }
      } catch (err) {
        setError("Error loading companies.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = async (companyId) => {
    if (selecting) return;
    setSelecting(true);

    try {
      const res = await selectCompanyApi(companyId);

      if (res.data.ok) {
        window.location.href = "/customer"; // refresh dashboard
      }
    } catch (err) {
      alert("Error selecting company");
    } finally {
      setSelecting(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Choose Your Company</h1>
      <p className={styles.subtitle}>
        Select a company to start ordering and tracking deliveries.
      </p>

      {/* Search */}
      <input
        type="text"
        placeholder="Search companies..."
        className={styles.search}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p className={styles.info}>Loading companies...</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        {filteredCompanies.map((c) => (
          <div key={c._id} className={styles.card}>
            <div className={styles.logoBox}>
              {c.logo ? (
                <img src={c.logo} alt={c.name} className={styles.logo} />
              ) : (
                <div className={styles.logoPlaceholder}>{c.name[0]}</div>
              )}
            </div>

            <h3 className={styles.companyName}>{c.name}</h3>
            {c.businessCategory && (
              <p className={styles.category}>{c.businessCategory}</p>
            )}

            <button
              className={styles.selectBtn}
              disabled={selecting}
              onClick={() => handleSelect(c._id)}
            >
              Select
            </button>
          </div>
        ))}
      </div>

      {!loading && filteredCompanies.length === 0 && (
        <p className={styles.info}>No companies match your search.</p>
      )}
    </div>
  );
};

export default SelectCompany;
