import api from "./axiosConfig";

/* ==========================================================
   🚗 MANAGER → DRIVERS (LIST & FILTERS)
   GET /api/manager/drivers
========================================================== */
export const getManagerDriversApi = (params = {}) => {
  return api.get("/manager/drivers", { params });
};

/* ==========================================================
   ➕ CREATE DRIVER PROFILE (NO EMAIL / PASSWORD)
   POST /api/manager/drivers
========================================================== */
export const createManagerDriverProfileApi = (data) => {
  return api.post("/manager/drivers", data);
};

/* ==========================================================
   ✏ UPDATE DRIVER BASIC PROFILE
   PATCH /api/manager/drivers/:driverId/profile
========================================================== */
export const updateManagerDriverProfileApi = (driverId, data) => {
  return api.patch(`/manager/drivers/${driverId}/profile`, data);
};

/* ==========================================================
   🛂 SUBMIT / UPDATE DRIVER VERIFICATION
   PATCH /api/manager/drivers/:driverId/verification
========================================================== */
export const submitDriverVerificationApi = (driverId, data) => {
  return api.patch(
    `/manager/drivers/${driverId}/verification`,
    data
  );
};

/* ==========================================================
   ✅ VERIFY DRIVER (MANAGER ACTION)
   PATCH /api/manager/drivers/:driverId/verify
========================================================== */
export const verifyDriverApi = (driverId) => {
  return api.patch(`/manager/drivers/${driverId}/verify`);
};

/* ==========================================================
   ❌ REJECT DRIVER
   PATCH /api/manager/drivers/:driverId/reject
========================================================== */
export const rejectDriverApi = (driverId, reason = "") => {
  return api.patch(`/manager/drivers/${driverId}/reject`, {
    reason,
  });
};

/* ==========================================================
   🔐 CREATE DRIVER LOGIN ACCOUNT (AFTER VERIFICATION)
   POST /api/manager/drivers/:driverId/create-account
========================================================== */
export const createDriverAccountApi = (driverId, data) => {
  return api.post(
    `/manager/drivers/${driverId}/create-account`,
    data
  );
};

/* ==========================================================
   🔁 ACTIVATE / SUSPEND DRIVER
   PATCH /api/manager/drivers/:driverId/toggle
========================================================== */
export const toggleManagerDriverStatusApi = (driverId) => {
  return api.patch(`/manager/drivers/${driverId}/toggle`);
};

/* ==========================================================
   📊 DRIVER PERFORMANCE STATS
   GET /api/manager/drivers/:driverId/stats
========================================================== */
export const getManagerDriverStatsApi = (driverId) => {
  return api.get(`/manager/drivers/${driverId}/stats`);
};
// GET drivers for a specific shop
// GET /api/manager/shops/:shopId/drivers
export const getShopDriversApi = (shopId) => {
  return api.get(`/manager/shops/${shopId}/drivers`);
};
