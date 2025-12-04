// client/src/pages/customer/CustomerSettings.jsx
import React, { useState } from "react";
import styles from "../../styles/customer/settings.module.css";

import ChangePassword from "../../components/customer/settings/ChangePassword";
import NotificationPrefs from "../../components/customer/settings/NotificationPrefs";
import CustomerSecurity from "../../pages/customer/CustomerSecurity";
import DeleteAccount from "../../components/customer/settings/DeleteAccount";

const CustomerSettings = () => {
  const [tab, setTab] = useState("password");

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.sub}>Manage your account, privacy & security.</p>

      {/* TABS */}
      <div className={styles.tabs}>
        <button
          className={tab === "password" ? styles.active : ""}
          onClick={() => setTab("password")}
        >
          🔒 Change Password
        </button>

        <button
          className={tab === "notifications" ? styles.active : ""}
          onClick={() => setTab("notifications")}
        >
          🔔 Notification Preferences
        </button>

        <button
          className={tab === "security" ? styles.active : ""}
          onClick={() => setTab("security")}
        >
          🛡 Security & Devices
        </button>

        <button
          className={tab === "delete" ? styles.activeDelete : ""}
          onClick={() => setTab("delete")}
        >
          ❌ Delete Account
        </button>
      </div>

      {/* CONTENT */}
      <div className={styles.content}>
        {tab === "password" && <ChangePassword />}
        {tab === "notifications" && <NotificationPrefs />}
        {tab === "security" && <CustomerSecurity />}
        {tab === "delete" && <DeleteAccount />}
      </div>
    </div>
  );
};

export default CustomerSettings;
