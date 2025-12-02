import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";
import styles from "../../styles/customer/editProfile.module.css";

const CustomerEditProfile = () => {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* ======================================================
     UPDATE PROFILE
  ====================================================== */
  const handleSave = async () => {
    try {
      setLoading(true);

      const res = await apiClient.put("/customer/profile/update-profile", {
        name,
        phone,
        address,
      });

      if (res.data.ok) {
        setUser(res.data.user);
        setMessage("Profile updated successfully!");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     UPDATE IMAGE
  ====================================================== */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await apiClient.put(
        "/customer/profile/update-image",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.ok) {
        setUser(res.data.user);
        setMessage("Profile image updated!");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error uploading image");
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Edit Profile</h1>
      <p className={styles.subtitle}>Update your personal information</p>

      {message && <p className={styles.message}>{message}</p>}

      <div className={styles.formCard}>
        {/* IMAGE */}
        <div className={styles.imageSection}>
          <img
            src={
              user?.profileImage
                ? `${import.meta.env.VITE_API_URL}${user.profileImage}`
                : "/default-avatar.png"
            }
            alt="profile"
            className={styles.profileImg}
          />

          <label className={styles.uploadBtn}>
            Change Image
            <input type="file" onChange={handleImageUpload} />
          </label>
        </div>

        {/* FORM */}
        <label className={styles.label}>Full Name</label>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className={styles.label}>Phone</label>
        <input
          className={styles.input}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <label className={styles.label}>Address</label>
        <input
          className={styles.input}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <button
          onClick={handleSave}
          className={styles.saveBtn}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default CustomerEditProfile;
