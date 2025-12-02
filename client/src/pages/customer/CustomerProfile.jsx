import React, { useEffect, useState } from "react";
import {
  getCustomerProfileApi,
  updateCustomerProfileApi,
  updateCustomerImageApi,
} from "../../api/customerProfileApi";

import styles from "../../styles/customer/profile.module.css";

const CustomerProfile = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    profileImage: "",
    role: "",
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await getCustomerProfileApi();
      if (res.data.ok) {
        setForm(res.data.user);
        setPreview(res.data.user.profileImage || null);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitProfile = async () => {
    try {
      setSaving(true);
      await updateCustomerProfileApi({
        name: form.name,
        phone: form.phone,
        address: form.address,
      });
      await loadProfile();
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const fd = new FormData();
    fd.append("image", file);

    try {
      setUploading(true);
      await updateCustomerImageApi(fd);
      await loadProfile();
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  if (loading) return <p className={styles.info}>Loading profile…</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Profile</h1>
      <p className={styles.sub}>Update your personal information</p>

      {/* PROFILE CARD */}
      <div className={styles.card}>
        <div className={styles.profileTop}>
          <div className={styles.imageBox}>
            <img
              src={
                preview
                  ? `${import.meta.env.VITE_API_URL}${preview}`
                  : "/default-avatar.png"
              }
              alt="profile"
            />

            <label className={styles.uploadBtn}>
              Change Photo
              <input type="file" onChange={uploadImage} />
            </label>
          </div>

          <div className={styles.meta}>
            <h3>{form.name}</h3>
            <p>{form.email}</p>
            <span className={styles.role}>{form.role}</span>
          </div>
        </div>

        {/* FORM */}
        <div className={styles.form}>
          <label>Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full Name"
          />

          <label>Phone Number</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone Number"
          />

          <label>Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
          />

          <button
            className={styles.saveBtn}
            onClick={submitProfile}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
