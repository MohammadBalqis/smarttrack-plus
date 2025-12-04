// client/src/api/managerShopProductsApi.js
import api from "./apiClient";

/* ============================================================
   📌 1) GET SHOP PRODUCTS (pagination + filters)
============================================================ */
export const getShopProductsApi = (params = {}) =>
  api.get("/manager/shop-products", { params });

/* ============================================================
   📌 2) GET BASE PRODUCTS THAT CAN BE ADDED TO SHOP
============================================================ */
export const getAvailableProductsApi = (params = {}) =>
  api.get("/manager/shop-products/available", { params });

/* ============================================================
   📌 3) ADD PRODUCT TO SHOP
============================================================ */
export const addProductToShopApi = (productId, data) =>
  api.post(`/manager/shop-products/${productId}`, data);

/* ============================================================
   📌 4) UPDATE PRICE FOR SHOP PRODUCT
============================================================ */
export const updateShopProductPriceApi = (shopProductId, price, discount = 0) =>
  api.put(`/manager/shop-products/${shopProductId}/price`, {
    price,
    discount,
  });

/* ============================================================
   📌 5) UPDATE STOCK FOR SHOP PRODUCT
============================================================ */
export const updateShopProductStockApi = (shopProductId, stock) =>
  api.put(`/manager/shop-products/${shopProductId}/stock`, { stock });

/* ============================================================
   📌 6) TOGGLE PRODUCT ACTIVE / INACTIVE
============================================================ */
export const toggleShopProductApi = (shopProductId) =>
  api.put(`/manager/shop-products/${shopProductId}/toggle`);
