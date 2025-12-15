import api from "./apiClient";

/* ==========================================================
   📋 LIST ALL DRIVERS (MANAGER)
========================================================== */
export const getManagerDriversApi = () =>
  api.get("/manager/drivers");

// /* ==========================================================
//    🏪 LIST DRIVERS BY SHOP (IMPORTANT)
// ========================================================== */
// export const getShopDriversApi = (shopId) => {
//   if (!shopId) throw new Error("shopId is required");
//   return api.get(`/manager/drivers/by-shop/${shopId}`);
// };

/* ==========================================================
   ➕ CREATE DRIVER PROFILE
========================================================== */
export const createDriverProfileApi = (data) =>
  api.post("/manager/drivers", data);

/* ==========================================================
   ✏ UPDATE DRIVER PROFILE
========================================================== */
export const updateDriverProfileApi = (driverId, data) => {
  if (!driverId) throw new Error("driverId is required");
  return api.patch(`/manager/drivers/${driverId}/profile`, data);
};

/* ==========================================================
   🛂 SUBMIT VERIFICATION (FILES)
========================================================== */
export const submitDriverVerificationApi = (driverId, formData) => {
  if (!driverId) throw new Error("driverId is required");
  if (!(formData instanceof FormData)) {
    throw new Error("formData must be FormData");
  }

  return api.patch(
    `/manager/drivers/${driverId}/verification`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
};

/* ==========================================================
   ✅ VERIFY DRIVER
========================================================== */
export const verifyDriverApi = (driverId) => {
  if (!driverId) throw new Error("driverId is required");
  return api.patch(`/manager/drivers/${driverId}/verify`);
};

/* ==========================================================
   ❌ REJECT DRIVER
========================================================== */
export const rejectDriverApi = (driverId, reason = "") => {
  if (!driverId) throw new Error("driverId is required");
  return api.patch(`/manager/drivers/${driverId}/reject`, { reason });
};

/* ==========================================================
   🔐 CREATE LOGIN ACCOUNT
========================================================== */
export const createDriverAccountApi = (driverId, data) => {
  if (!driverId) throw new Error("driverId is required");
  return api.post(`/manager/drivers/${driverId}/create-account`, data);
};

/* ==========================================================
   ⛔ SUSPEND / UNSUSPEND
========================================================== */
export const toggleDriverSuspendApi = (driverId) => {
  if (!driverId) throw new Error("driverId is required");
  return api.patch(`/manager/drivers/${driverId}/toggle-suspend`);
};

/* ==========================================================
   🗑 DELETE DRIVER
========================================================== */
export const deleteDriverApi = (driverId) => {
  if (!driverId) throw new Error("driverId is required");
  return api.delete(`/manager/drivers/${driverId}`);
};
