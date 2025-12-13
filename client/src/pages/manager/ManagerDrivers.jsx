import React, { useEffect, useState } from "react";
import {
  getManagerDriversApi,
  toggleManagerDriverStatusApi,
  verifyDriverApi,
  rejectDriverApi,
  createDriverAccountApi,
} from "../../api/managerDriversApi";

import styles from "../../styles/manager/managerDrivers.module.css";

const ManagerDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const res = await getManagerDriversApi();
      setDrivers(res.data.drivers || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load drivers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  /* =========================
     ACTIONS
  ========================= */

  const handleVerify = async (driverId) => {
    await verifyDriverApi(driverId);
    loadDrivers();
  };

  const handleReject = async (driverId) => {
    const reason = prompt("Rejection reason?");
    if (!reason) return;
    await rejectDriverApi(driverId, reason);
    loadDrivers();
  };

  const handleCreateAccount = async (driverId) => {
    const email = prompt("Driver email:");
    const password = prompt("Temporary password:");

    if (!email || !password) return;

    await createDriverAccountApi(driverId, { email, password });
    loadDrivers();
  };

  const renderStatusBadge = (d) => {
    if (d.driverVerificationStatus === "verified")
      return <span className={styles.verified}>Verified</span>;
    if (d.driverVerificationStatus === "rejected")
      return <span className={styles.rejected}>Rejected</span>;
    return <span className={styles.pending}>Pending</span>;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Drivers</h1>
        <p>Driver onboarding & verification</p>
      </div>

      {loading && <p>Loading drivers...</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        {drivers.map((d) => (
          <div key={d._id} className={styles.card}>
            <div className={styles.top}>
              <img
                src={d.profileImage || "/placeholder-user.png"}
                alt="Driver"
                className={styles.avatar}
              />
              {renderStatusBadge(d)}
            </div>

            <h3>{d.name}</h3>
            <p className={styles.phone}>{d.phone || "—"}</p>
            <p className={styles.address}>{d.address || "—"}</p>

            <div className={styles.section}>
              <strong>ID Number:</strong>{" "}
              {d.driverVerification?.idNumber || "—"}
            </div>

            <div className={styles.images}>
              <img
                src={
                  d.driverVerification?.vehicleImage ||
                  "/placeholder-car.png"
                }
                alt="Vehicle"
              />
              <img
                src={
                  d.driverVerification?.idImage ||
                  "/placeholder-id.png"
                }
                alt="ID Card"
              />
            </div>

            <div className={styles.footer}>
              <span>
                Plate:{" "}
                {d.driverVerification?.vehiclePlateNumber || "—"}
              </span>
            </div>

            {/* ACTIONS */}
            <div className={styles.actions}>
              {d.driverVerificationStatus === "pending" && (
                <>
                  <button
                    className={styles.approveBtn}
                    onClick={() => handleVerify(d._id)}
                  >
                    Verify
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => handleReject(d._id)}
                  >
                    Reject
                  </button>
                </>
              )}

              {d.driverVerificationStatus === "verified" &&
                d.driverOnboardingStage !== "account_created" && (
                  <button
                    className={styles.createBtn}
                    onClick={() => handleCreateAccount(d._id)}
                  >
                    Create Account
                  </button>
                )}

              {d.driverOnboardingStage === "account_created" && (
                <span className={styles.accountReady}>
                  Account Ready
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagerDrivers;
