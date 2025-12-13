import React, { useEffect, useState } from "react";
import {
  updateManagerDriverProfileApi,
  submitDriverVerificationApi,
  verifyDriverApi,
  rejectDriverApi,
  createDriverAccountApi,
} from "../../api/managerDriversApi";

import styles from "../../styles/manager/managerDrivers.module.css";

const ManagerDriverDrawer = ({ open, onClose, driver, onUpdated }) => {
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [verification, setVerification] = useState({
    idNumber: "",
    vehiclePlateNumber: "",
  });

  const [account, setAccount] = useState({
    email: "",
    password: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!driver) return;

    setProfile({
      name: driver.name || "",
      phone: driver.phone || "",
      address: driver.address || "",
    });

    setVerification({
      idNumber: driver.driverVerification?.idNumber || "",
      vehiclePlateNumber:
        driver.driverVerification?.vehiclePlateNumber || "",
    });
  }, [driver]);

  if (!open || !driver) return null;

  const isVerified = driver.driverVerificationStatus === "verified";
  const isAccountCreated =
    driver.driverOnboardingStage === "account_created";

  /* ================================
     PROFILE
  ================================= */
  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateManagerDriverProfileApi(driver._id, profile);
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  /* ================================
     VERIFICATION
  ================================= */
  const saveVerification = async () => {
    setSaving(true);
    try {
      await submitDriverVerificationApi(driver._id, verification);
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const verifyDriver = async () => {
    await verifyDriverApi(driver._id);
    onUpdated();
  };

  const rejectDriver = async () => {
    const reason = prompt("Reason for rejection?");
    if (!reason) return;
    await rejectDriverApi(driver._id, reason);
    onUpdated();
  };

  /* ================================
     ACCOUNT
  ================================= */
  const createAccount = async () => {
    setSaving(true);
    try {
      await createDriverAccountApi(driver._id, account);
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        <header className={styles.drawerHeader}>
          <h2>Driver Onboarding</h2>
          <button onClick={onClose}>✕</button>
        </header>

        {/* PROFILE */}
        <section className={styles.section}>
          <h4>Profile</h4>
          <input
            placeholder="Full name"
            value={profile.name}
            onChange={(e) =>
              setProfile({ ...profile, name: e.target.value })
            }
          />
          <input
            placeholder="Phone"
            value={profile.phone}
            onChange={(e) =>
              setProfile({ ...profile, phone: e.target.value })
            }
          />
          <input
            placeholder="Address"
            value={profile.address}
            onChange={(e) =>
              setProfile({ ...profile, address: e.target.value })
            }
          />
          <button onClick={saveProfile} disabled={saving}>
            Save Profile
          </button>
        </section>

        {/* VERIFICATION */}
        <section className={styles.section}>
          <h4>Verification</h4>
          <input
            placeholder="ID Number"
            value={verification.idNumber}
            onChange={(e) =>
              setVerification({
                ...verification,
                idNumber: e.target.value,
              })
            }
          />
          <input
            placeholder="Vehicle Plate Number"
            value={verification.vehiclePlateNumber}
            onChange={(e) =>
              setVerification({
                ...verification,
                vehiclePlateNumber: e.target.value,
              })
            }
          />

          <button onClick={saveVerification} disabled={saving}>
            Save Verification
          </button>

          {!isVerified && (
            <div className={styles.row}>
              <button
                className={styles.successBtn}
                onClick={verifyDriver}
              >
                Verify Driver
              </button>
              <button
                className={styles.dangerBtn}
                onClick={rejectDriver}
              >
                Reject
              </button>
            </div>
          )}
        </section>

        {/* ACCOUNT */}
        {isVerified && !isAccountCreated && (
          <section className={styles.section}>
            <h4>Create Driver Account</h4>
            <input
              placeholder="Email"
              value={account.email}
              onChange={(e) =>
                setAccount({ ...account, email: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="Password"
              value={account.password}
              onChange={(e) =>
                setAccount({ ...account, password: e.target.value })
              }
            />
            <button onClick={createAccount} disabled={saving}>
              Create Account
            </button>
          </section>
        )}

        {isAccountCreated && (
          <p className={styles.successText}>
            ✔ Driver account created
          </p>
        )}
      </div>
    </div>
  );
};

export default ManagerDriverDrawer;
