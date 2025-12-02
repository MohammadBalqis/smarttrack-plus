import React, { useEffect, useState } from "react";
import {
  getCustomerSettingsApi,
  updateCustomerSettingsApi,
} from "../../api/customerSettingsApi";

import styles from "../../styles/customer/settings.module.css";

const CustomerSettings = () => {
  const [settings, setSettings] = useState({
    darkMode: false,
    language: "en",
    allowLocation: true,
    shareLocationWithDriver: true,
  });

  const [notifications, setNotifications] = useState({
    driverAssigned: true,
    driverArrived: true,
    orderDelivered: true,
    orderCancelled: true,
    paymentSuccess: true,
    promotions: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await getCustomerSettingsApi();
      if (res.data.ok) {
        setSettings(res.data.settings);
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleSetting = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const toggleNotification = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      await updateCustomerSettingsApi({
        settings,
        notifications,
      });
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  if (loading) return <p className={styles.info}>Loading settings…</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.sub}>Control your app experience</p>

      {/* NOTIFICATIONS */}
      <div className={styles.card}>
        <h3>Notifications</h3>

        {Object.keys(notifications).map((key) => (
          <div key={key} className={styles.row}>
            <span>{key.replace(/([A-Z])/g, " $1")}</span>
            <input
              type="checkbox"
              checked={notifications[key]}
              onChange={() => toggleNotification(key)}
            />
          </div>
        ))}
      </div>

      {/* GENERAL SETTINGS */}
      <div className={styles.card}>
        <h3>General</h3>

        <div className={styles.row}>
          <span>Dark Mode</span>
          <input
            type="checkbox"
            checked={settings.darkMode}
            onChange={() => toggleSetting("darkMode")}
          />
        </div>

        <div className={styles.row}>
          <span>Allow Location</span>
          <input
            type="checkbox"
            checked={settings.allowLocation}
            onChange={() => toggleSetting("allowLocation")}
          />
        </div>

        <div className={styles.row}>
          <span>Share Location with Driver</span>
          <input
            type="checkbox"
            checked={settings.shareLocationWithDriver}
            onChange={() => toggleSetting("shareLocationWithDriver")}
          />
        </div>

        <div className={styles.row}>
          <span>Language</span>
          <select
            value={settings.language}
            onChange={(e) =>
              setSettings({ ...settings, language: e.target.value })
            }
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </div>

      {/* SAVE */}
      <button className={styles.saveBtn} onClick={saveAll} disabled={saving}>
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
};

export default CustomerSettings;
