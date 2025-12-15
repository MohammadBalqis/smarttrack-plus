import React, { useEffect, useState } from "react";
import api from "../../../api/apiClient";
import { useNavigate } from "react-router-dom";
import styles from "../../../styles/company/companyManagersChatList.module.css";

const CompanyManagersChatList = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadManagers = async () => {
      try {
        const res = await api.get("/company/manager/list");
        setManagers(res.data.data || []);
      } catch (err) {
        console.error("Failed to load managers", err);
      } finally {
        setLoading(false);
      }
    };

    loadManagers();
  }, []);

  if (loading) return <div className={styles.loader}>Loading managers...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Managers</h1>
      <p className={styles.subtitle}>Select a manager to start chatting</p>

      <div className={styles.cardContainer}>
        {managers.map((m) => (
          <div key={m._id} className={styles.card}>
            <div className={styles.info}>
              <div className={styles.name}>{m.fullName}</div>
              <div className={styles.phone}>{m.phone}</div>
              <div className={styles.branch}>
                Branch: {m.branchName || "—"}
              </div>
            </div>

            <button
              className={styles.chatBtn}
              onClick={() => navigate("/company/chat")}
            >
              💬 Chat
            </button>
          </div>
        ))}

        {managers.length === 0 && (
          <div className={styles.noData}>No managers found.</div>
        )}
      </div>
    </div>
  );
};

export default CompanyManagersChatList;
