// client/src/api/authApi.js
import api from "./apiClient";

/* ==========================================================
   🔐 LOGIN — All Roles
   POST /api/auth/login
========================================================== */
export const loginApi = (email, password) => {
  return api.post("/auth/login", { email, password });
};

/* ==========================================================
   🟢 REGISTER — CUSTOMER SELF SIGNUP ONLY
   POST /api/auth/register
========================================================== */
export const registerApi = (name, email, password) => {
  return api.post("/auth/register", { name, email, password, role: "customer" });
};
export const registerCompanyApi = (payload) => {
  return api.post("/auth/register-company", payload);
};

/* ==========================================================
   👑 SUPERADMIN CREATES COMPANY ACCOUNT
   POST /api/auth/superadmin/create-company
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
   🟠 COMPANY creates MANAGER or DRIVER
   POST /api/auth/company/create-user
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
