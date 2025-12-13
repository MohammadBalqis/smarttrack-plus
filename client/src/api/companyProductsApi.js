// client/src/api/companyProductsApi.js
import api from "./apiClient";

/* ==========================================================
   📦 GET PRODUCTS (list)
========================================================== */
export const getCompanyProductsApi = (params = {}) => {
  return api.get("/company/products", { params });
};

/* ==========================================================
   ➕ CREATE PRODUCT (WITH IMAGE FILES)
========================================================== */
export const createCompanyProductApi = (data) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (key === "images" && Array.isArray(value)) {
      value.forEach((file) => {
        if (file instanceof File) {
          formData.append("images", file);
        }
      });
    } else {
      formData.append(key, value);
    }
  });

  return api.post("/company/products", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/* ==========================================================
   ✏️ UPDATE PRODUCT (WITH IMAGE FILES)
========================================================== */
export const updateCompanyProductApi = (productId, data) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (key === "images" && Array.isArray(value)) {
      value.forEach((file) => {
        if (file instanceof File) {
          formData.append("images", file);
        }
      });
    } else {
      formData.append(key, value);
    }
  });

  return api.put(`/company/products/${productId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/* ==========================================================
   🔄 TOGGLE ACTIVE / INACTIVE
========================================================== */
export const toggleCompanyProductActiveApi = (productId) => {
  return api.patch(`/company/products/${productId}/toggle`);
};

/* ==========================================================
   🔍 GET SINGLE PRODUCT
========================================================== */
export const getSingleCompanyProductApi = (productId) => {
  return api.get(`/company/products/${productId}`);
};

/* ==========================================================
   📉📈 ADJUST STOCK
========================================================== */
export const adjustCompanyProductStockApi = (
  productId,
  amount,
  reason = ""
) => {
  return api.patch(`/company/products/${productId}/stock`, {
    amount,
    reason,
  });
};
