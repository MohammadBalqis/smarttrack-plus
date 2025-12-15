import api from "./apiClient";

/* ==========================================================
   📋 LIST MANAGERS
========================================================== */
export const getCompanyManagersApi = () =>
  api.get("/company/managers");

/* ==========================================================
   ➕ CREATE MANAGER PROFILE
========================================================== */
export const createCompanyManagerApi = (data) =>
  api.post("/company/managers", data);

/* ==========================================================
   ✏ UPDATE MANAGER PROFILE
========================================================== */
export const updateCompanyManagerApi = (managerId, data) =>
  api.patch(`/company/managers/${managerId}/profile`, data);

/* ==========================================================
   🛂 SUBMIT VERIFICATION
========================================================== */
export const submitManagerVerificationApi = (managerId, formData) =>
  api.patch(`/company/managers/${managerId}/verification`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/* ==========================================================
   🗑 DELETE DRIVER
========================================================== */
export const deleteManagerDriverApi = (driverId) => {
  return api.delete(`/manager/drivers/${driverId}`);
};

/* ==========================================================
   ✅ VERIFY MANAGER
========================================================== */
export const verifyManagerApi = (managerId) =>
  api.patch(`/company/managers/${managerId}/verify`);

/* ==========================================================
   ❌ REJECT MANAGER
========================================================== */
export const rejectManagerApi = (managerId, reason) =>
  api.patch(`/company/managers/${managerId}/reject`, { reason });

/* ==========================================================
   🔐 CREATE LOGIN
========================================================== */
export const createManagerAccountApi = (managerId, data) =>
  api.post(`/company/managers/${managerId}/create-account`, data);

/* ==========================================================
   🔁 TOGGLE ACTIVE
========================================================== */
export const toggleManagerStatusApi = (managerId) =>
  api.patch(`/company/managers/${managerId}/toggle`);
