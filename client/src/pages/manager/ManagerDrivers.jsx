import React, { useEffect, useState } from "react";
import {
  getManagerDriversApi,
  createDriverProfileApi,
  submitDriverVerificationApi,
  createDriverAccountApi,
  toggleDriverSuspendApi,
  deleteDriverApi,
} from "../../api/managerDriversApi";

import styles from "../../styles/manager/managerDrivers.module.css";

/* ==========================================================
   CONSTANTS
========================================================== */
const emptyForm = {
  name: "",
  phone: "",
  address: "",
};

const ManagerDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [showVerify, setShowVerify] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [verifyData, setVerifyData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /* ==========================================================
     LOAD DRIVERS
  ========================================================== */
  const loadDrivers = async () => {
    try {
      setLoading(true);
      const res = await getManagerDriversApi();
      setDrivers(res.data.drivers || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  /* ==========================================================
     CREATE DRIVER
  ========================================================== */
  const handleCreateDriver = async () => {
    if (!form.name.trim()) {
      alert("Driver name is required");
      return;
    }

    try {
      await createDriverProfileApi(form);
      setForm(emptyForm);
      setShowCreate(false);
      loadDrivers();
    } catch (err) {
      console.error(err);
      alert("Failed to create driver");
    }
  };

  /* ==========================================================
     SUBMIT VERIFICATION
  ========================================================== */
  const handleSubmitVerification = async (driverId) => {
    const d = verifyData[driverId];

    // 🔴 STRICT VALIDATION (MATCHES BACKEND)
    if (
      !d?.idNumber ||
      !d?.plateNumber ||
      !d?.profileImage ||
      !d?.idImage ||
      !d?.vehicleImage
    ) {
      alert("Please fill all fields and upload all required images");
      return;
    }

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append("idNumber", d.idNumber);
      fd.append("plateNumber", d.plateNumber);
      fd.append("profileImage", d.profileImage);
      fd.append("idImage", d.idImage);
      fd.append("vehicleImage", d.vehicleImage);

      await submitDriverVerificationApi(driverId, fd);

      setShowVerify(null);
      setVerifyData({});
      loadDrivers();
    } catch (err) {
      console.error(err);
      alert("Failed to submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  /* ==========================================================
     STATUS BADGE
  ========================================================== */
  const statusBadge = (s) => {
    if (s === "online") return styles.online;
    if (s === "on_trip") return styles.onTrip;
    if (s === "suspended") return styles.suspended;
    return styles.offline;
  };

  if (loading) return <p>Loading drivers…</p>;

  /* ==========================================================
     RENDER
  ========================================================== */
  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>Drivers</h1>
        <button type="button" onClick={() => setShowCreate(true)}>
          + Add Driver
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {/* ================= DRIVER GRID ================= */}
      <div className={styles.grid}>
        {drivers.map((d) => (
          <div key={d._id} className={styles.card}>
            <div className={styles.top}>
              <img
                src={d.profileImage || "/placeholder-user.png"}
                alt="Driver"
              />
              <span className={`${styles.status} ${statusBadge(d.status)}`}>
                {d.status}
              </span>
            </div>

            <h3>{d.name}</h3>
            <p>{d.phone || "—"}</p>
            <p>{d.address || "—"}</p>

            <div className={styles.actions}>
              {d.verification?.status !== "verified" && (
                <button type="button" onClick={() => setShowVerify(d)}>
                  Complete Verification
                </button>
              )}

              {d.verification?.status === "verified" && !d.hasAccount && (
                <button
                  type="button"
                  onClick={() => {
                    const email = prompt("Email:");
                    const password = prompt("Password:");
                    if (email && password) {
                      createDriverAccountApi(d._id, { email, password }).then(
                        loadDrivers
                      );
                    }
                  }}
                >
                  Create Account
                </button>
              )}

              <button
                type="button"
                className={styles.suspend}
                onClick={() =>
                  toggleDriverSuspendApi(d._id).then(loadDrivers)
                }
              >
                {d.status === "suspended" ? "Unsuspend" : "Suspend"}
              </button>

              <button
                type="button"
                className={styles.delete}
                onClick={() => {
                  if (confirm("Delete driver permanently?")) {
                    deleteDriverApi(d._id).then(loadDrivers);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= CREATE MODAL ================= */}
      {showCreate && (
        <div className={styles.modal}>
          <div className={styles.modalCard}>
            <h3>Create Driver</h3>

            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />
            <input
              placeholder="Address"
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
            />

            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="button" onClick={handleCreateDriver}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VERIFY MODAL ================= */}
      {showVerify && (
        <div className={styles.modal}>
          <div className={styles.modalCard}>
            <h3>Verification – {showVerify.name}</h3>

            <input
              placeholder="ID Number"
              onChange={(e) =>
                setVerifyData((v) => ({
                  ...v,
                  [showVerify._id]: {
                    ...v[showVerify._id],
                    idNumber: e.target.value,
                  },
                }))
              }
            />

            <input
              placeholder="Plate Number"
              onChange={(e) =>
                setVerifyData((v) => ({
                  ...v,
                  [showVerify._id]: {
                    ...v[showVerify._id],
                    plateNumber: e.target.value,
                  },
                }))
              }
            />

            <input
              type="file"
              onChange={(e) =>
                setVerifyData((v) => ({
                  ...v,
                  [showVerify._id]: {
                    ...v[showVerify._id],
                    profileImage: e.target.files[0],
                  },
                }))
              }
            />

            <input
              type="file"
              onChange={(e) =>
                setVerifyData((v) => ({
                  ...v,
                  [showVerify._id]: {
                    ...v[showVerify._id],
                    idImage: e.target.files[0],
                  },
                }))
              }
            />

            <input
              type="file"
              onChange={(e) =>
                setVerifyData((v) => ({
                  ...v,
                  [showVerify._id]: {
                    ...v[showVerify._id],
                    vehicleImage: e.target.files[0],
                  },
                }))
              }
            />

            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowVerify(null)}>
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  handleSubmitVerification(showVerify._id)
                }
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDrivers;
