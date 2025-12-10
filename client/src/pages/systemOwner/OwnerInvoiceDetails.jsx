import React, { useEffect, useState } from "react";
import {
  getOwnerInvoiceByIdApi,
  markInvoicePaidApi,
} from "../../api/ownerApi";
import { useParams } from "react-router-dom";

import styles from "../../styles/systemOwner/ownerInvoiceDetails.module.css";

const OwnerInvoiceDetails = () => {
  const { invoiceId } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      setInfo("");

      const res = await getOwnerInvoiceByIdApi(invoiceId);
      setInvoice(res.data?.invoice || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load invoice.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    try {
      setInfo("Processing...");
      await markInvoicePaidApi(invoiceId);
      setInfo("Invoice marked as PAID.");
      loadData();
    } catch {
      setError("Could not mark invoice as paid.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className={styles.page}>Loading...</div>;
  if (!invoice) return <div className={styles.page}>Invoice not found.</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Invoice Details</h1>

      {error && <p className={styles.errorText}>{error}</p>}
      {info && <p className={styles.infoText}>{info}</p>}

      <div className={styles.card}>
        <p><strong>Company:</strong> {invoice.companyName}</p>
        <p><strong>Plan:</strong> {invoice.plan}</p>
        <p><strong>Drivers:</strong> {invoice.driverCount}</p>
        <p><strong>Amount:</strong> ${invoice.amount}</p>
        <p><strong>Status:</strong> {invoice.status}</p>
        <p>
          <strong>Period:</strong>{" "}
          {invoice.periodStart?.slice(0, 10)} → {invoice.periodEnd?.slice(0, 10)}
        </p>

        {invoice.status === "unpaid" && (
          <button className={styles.payBtn} onClick={handleMarkPaid}>
            Mark as Paid
          </button>
        )}
      </div>
    </div>
  );
};

export default OwnerInvoiceDetails;
