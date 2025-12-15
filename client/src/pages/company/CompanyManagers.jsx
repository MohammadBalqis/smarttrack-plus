import React, { useEffect, useState } from "react";
import {
  getCompanyManagersApi,
  createCompanyManagerApi,
  submitManagerVerificationApi,
  verifyManagerApi,
  createManagerAccountApi,
  toggleManagerStatusApi,
} from "../../api/companyManagersApi";

import { getCompanyShopsApi } from "../../api/companyShopsApi";
import styles from "../../styles/company/companyManagers.module.css";

const emptyForm = {
  name: "",
  phone: "",
  address: "",
  shopId: "",
};

const CompanyManagers = () => {
  const [managers, setManagers] = useState([]);
  const [shops, setShops] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [verification, setVerification] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ================= LOAD DATA ================= */
  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, sRes] = await Promise.all([
        getCompanyManagersApi(),
        getCompanyShopsApi(),
      ]);

      setManagers(mRes.data.managers || []);
      setShops(sRes.data.shops || []);
    } catch {
      setError("Failed to load managers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= CREATE MANAGER ================= */
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await createCompanyManagerApi(form);
      setForm(emptyForm);
      await loadData();
    } catch {
      setError("Failed to create manager.");
    } finally {
      setSaving(false);
    }
  };

  /* ================= SUBMIT VERIFICATION ================= */
  const handleSubmitVerification = async (managerId) => {
    const data = verification[managerId];
    if (!data?.idNumber || !data?.idImageFile) {
      alert("ID Number and ID Image are required.");
      return;
    }

    const formData = new FormData();
    formData.append("idNumber", data.idNumber);
    formData.append("idImage", data.idImageFile);

    await submitManagerVerificationApi(managerId, formData);
    loadData();
  };

  /* ================= ACTIONS ================= */
  const handleVerify = async (id) => {
    await verifyManagerApi(id);
    loadData();
  };

  const handleCreateAccount = async (id) => {
    const email = prompt("Manager Email:");
    const password = prompt("Password:");
    if (!email || !password) return;

    await createManagerAccountApi(id, { email, password });
    loadData();
  };

  const handleToggle = async (id) => {
    await toggleManagerStatusApi(id);
    loadData();
  };

  if (loading) return <p className={styles.info}>Loading managers…</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Shop Managers</h1>
      {error && <p className={styles.error}>{error}</p>}

      {/* ================= CREATE MANAGER ================= */}
      <form onSubmit={handleCreate} className={styles.form}>
        <h3>Create Manager</h3>

        <input
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <input
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        <select
          value={form.shopId}
          onChange={(e) => setForm({ ...form, shopId: e.target.value })}
        >
          <option value="">Assign to shop</option>
          {shops.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} — {s.city}
            </option>
          ))}
        </select>

        <button disabled={saving}>
          {saving ? "Saving..." : "Create Manager"}
        </button>
      </form>

      {/* ================= MANAGERS LIST ================= */}
      <div className={styles.grid}>
        {managers.map((m) => {
          const verificationData = verification[m._id] || {};
          const canVerify =
            m.managerVerificationStatus === "pending" &&
            verificationData.idNumber &&
            verificationData.idImageFile;

          return (
            <div key={m._id} className={styles.card}>
              <h3>{m.name}</h3>
              <p>Phone: {m.phone || "—"}</p>
              <p>Shop: {m.shopId ? m.shopId.name : "Not assigned"}</p>
              <p>Status: {m.isActive ? "Active" : "Inactive"}</p>
              <p>Verification: {m.managerVerificationStatus}</p>
              <p>Onboarding: {m.managerOnboardingStage}</p>

              {/* 🔐 VERIFICATION */}
              {m.managerVerificationStatus === "pending" && (
                <div className={styles.verifyBox}>
                  <input
                    placeholder="ID Number"
                    onChange={(e) =>
                      setVerification((v) => ({
                        ...v,
                        [m._id]: {
                          ...v[m._id],
                          idNumber: e.target.value,
                        },
                      }))
                    }
                  />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setVerification((v) => ({
                        ...v,
                        [m._id]: {
                          ...v[m._id],
                          idImageFile: e.target.files[0],
                        },
                      }))
                    }
                  />

                  <button
                    onClick={() => handleSubmitVerification(m._id)}
                    className={styles.submitBtn}
                  >
                    Submit Verification
                  </button>

                  <button
                    disabled={!canVerify}
                    onClick={() => handleVerify(m._id)}
                    className={styles.verifyBtn}
                  >
                    Verify
                  </button>
                </div>
              )}

              {m.managerVerificationStatus === "verified" &&
                m.managerOnboardingStage !== "account_created" && (
                  <button
                    className={styles.createBtn}
                    onClick={() => handleCreateAccount(m._id)}
                  >
                    Create Login
                  </button>
                )}

              <button
                className={styles.toggleBtn}
                onClick={() => handleToggle(m._id)}
              >
                {m.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompanyManagers;
