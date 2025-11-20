import React, { useEffect, useState } from "react";
import {
  getCompanyByIdApi,
  updateCompanyApi,
  suspendCompanyApi,
  activateCompanyApi,
} from "../../api/adminApi";
import { useParams } from "react-router-dom";
import styles from "../../styles/admin/adminDashboard.module.css";

const CompanyDetails = () => {
  const { id } = useParams();

  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    const res = await getCompanyByIdApi(id);
    setCompany(res.data.company);
    setForm({
      name: res.data.company.name,
      email: res.data.company.email,
    });
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async () => {
    setSaving(true);
    await updateCompanyApi(id, form);
    loadCompany();
    setSaving(false);
  };

  const handleSuspend = async () => {
    await suspendCompanyApi(id);
    loadCompany();
  };

  const handleActivate = async () => {
    await activateCompanyApi(id);
    loadCompany();
  };

  if (!company) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      <h2>Company Details</h2>

      <div className={styles.detailsCard}>
        <label>Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
        />

        <label>Email</label>
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
        />

        <button
          className={styles.primaryBtn}
          onClick={handleUpdate}
          disabled={saving}
        >
          Save Changes
        </button>

        {company.isActive ? (
          <button
            className={styles.dangerBtn}
            onClick={handleSuspend}
          >
            Suspend Company
          </button>
        ) : (
          <button
            className={styles.primaryBtn}
            onClick={handleActivate}
          >
            Activate Company
          </button>
        )}
      </div>
    </div>
  );
};

export default CompanyDetails;
