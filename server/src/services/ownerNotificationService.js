import { sendEmail } from "../utils/email.js";

const OWNER_EMAIL = process.env.OWNER_EMAIL;

/* ==========================================================
   🔔 1) Company became PAST DUE
========================================================== */
export const notifyCompanyPastDue = async (company) => {
  const html = `
    <h2>Company Payment Overdue</h2>
    <p>The company <strong>${company.name}</strong> is now <span style="color:red;">PAST DUE</span>.</p>
    <p>Drivers: ${company.subscription.lastDriverCount}</p>
    <p>Monthly Price: $${company.subscription.priceUsd}</p>
  `;

  return sendEmail({
    to: OWNER_EMAIL,
    subject: `🚨 SmartTrack+ — Company Past Due: ${company.name}`,
    html,
  });
};

/* ==========================================================
   🔔 2) Company Suspended
========================================================== */
export const notifyCompanySuspended = async (company) => {
  const html = `
    <h2>Company Suspended</h2>
    <p>The company <strong>${company.name}</strong> has been suspended for non-payment.</p>
  `;

  return sendEmail({
    to: OWNER_EMAIL,
    subject: `⛔ SmartTrack+ — Company Suspended: ${company.name}`,
    html,
  });
};

/* ==========================================================
   🔔 3) Monthly Invoice Generated
========================================================== */
export const notifyInvoiceGenerated = async (invoice, company) => {
  const html = `
    <h2>New Monthly Invoice Generated</h2>
    <p>Company: <strong>${company.name}</strong></p>
    <p>Period: ${invoice.periodStart.toDateString()} → ${invoice.periodEnd.toDateString()}</p>
    <p>Amount: <strong>$${invoice.amount}</strong></p>
  `;

  return sendEmail({
    to: OWNER_EMAIL,
    subject: `📄 SmartTrack+ — Invoice Generated for ${company.name}`,
    html,
  });
};
