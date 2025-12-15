// client/src/api/authApi.js
import api from "./apiClient";

/* ==========================================================
   🔐 LOGIN — ALL ROLES
   POST /api/auth/login
   Supports:
   - email + password
   - phone + password
========================================================== */
export const loginApi = (email, password, phone = null) => {
  const payload = phone
    ? { phone, password }
    : { email, password };

  return api.post("/auth/login", payload);
};

/* ==========================================================
   🟢 REGISTER — LEGACY EMAIL REGISTER (KEEP)
========================================================== */
export const registerApi = (name, email, password) => {
  return api.post("/auth/register", {
    name,
    email,
    password,
    role: "customer",
  });
};

/* ==========================================================
   👤 REGISTER — CUSTOMER (PHONE BASED)
   POST /api/auth/register-customer
========================================================== */
export const registerCustomerApi = (formData) => {
  return api.post("/auth/register-customer", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/* ==========================================================
   🏢 REGISTER COMPANY
========================================================== */
export const registerCompanyApi = (payload) => {
  return api.post("/auth/register-company", payload);
};

/* ==========================================================
   👑 SUPERADMIN CREATES COMPANY
========================================================== */
export const superAdminCreateCompanyApi = ({
  name,
  email,
  password,
  companyName,
}) => {
  return api.post("/auth/superadmin/create-company", {
    name,
    email,
    password,
    companyName,
  });
};

/* ==========================================================
   🟠 COMPANY CREATES MANAGER / DRIVER
========================================================== */
export const companyCreateUserApi = ({
  name,
  email,
  password,
  role,
  shopId = null,
}) => {
  return api.post("/auth/company/create-user", {
    name,
    email,
    password,
    role,
    shopId,
  });
};
