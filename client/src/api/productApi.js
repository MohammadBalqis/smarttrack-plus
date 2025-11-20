import api from "./axiosConfig";

/* ==========================================================
   🟢 CREATE PRODUCT
   ========================================================== */
export const createProductApi = (data) => {
  return api.post("/products/create", data);
};

/* ==========================================================
   📦 GET ALL PRODUCTS FOR COMPANY (company / manager)
   ========================================================== */
export const getCompanyProductsApi = () => {
  return api.get("/products/company-products");
};

/* ==========================================================
   🛒 GET PRODUCTS FOR CUSTOMER (active only)
   ========================================================== */
export const getCustomerProductsApi = () => {
  return api.get("/products/customer-products");
};

/* ==========================================================
   ✏️ UPDATE PRODUCT
   ========================================================== */
export const updateProductApi = (id, data) => {
  return api.put(`/products/${id}`, data);
};

/* ==========================================================
   🔁 TOGGLE PRODUCT ACTIVE / INACTIVE
   ========================================================== */
export const toggleProductActiveApi = (id) => {
  return api.patch(`/products/${id}/toggle-active`);
};

/* ==========================================================
   🗑 DELETE PRODUCT
   ========================================================== */
export const deleteProductApi = (id) => {
  return api.delete(`/products/${id}`);
};
