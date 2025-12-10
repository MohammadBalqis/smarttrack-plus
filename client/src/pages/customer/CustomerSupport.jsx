import React, { useState } from "react";
import api from "../../api/apiClient";
import styles from "../../styles/customer/customerSupport.module.css";
import { useAuth } from "../../context/AuthContext";

const CustomerSupport = () => {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { activeCompanyId } = useAuth(); // If stored in your customer auth

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      setLoading(true);

      await api.post("/customer/support", {
        companyId: activeCompanyId,
        message,
      });

      setSent(true);
    } catch (err) {
      alert("Failed to send message. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.successBox}>
        <h2>Message Sent ✔</h2>
        <p>Your support request has been submitted to the company.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Support / Contact Company</h1>

      <textarea
        className={styles.textarea}
        placeholder="Write your note or complaint..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        className={styles.sendBtn}
        onClick={handleSend}
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
    </div>
  );
};

export default CustomerSupport;
