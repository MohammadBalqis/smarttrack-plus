import React, { useEffect, useState } from "react";
import { getDriverProfileApi, updateDriverProfileApi } from "../../api/driverApi";

import styles from "../../styles/driver/driverProfile.module.css";

const DriverProfile = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getDriverProfileApi();
      setForm(res.data.profile);
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateDriverProfileApi(form);
      alert("Profile updated.");
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Profile</h1>

      <div className={styles.card}>
        <label>Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <label>Phone</label>
        <input
          type="text"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <label>Address</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        <button className={styles.saveBtn} onClick={handleUpdate}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default DriverProfile;
