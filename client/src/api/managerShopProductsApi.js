// client/src/api/managerShopProductsApi.js
import api from "./apiClient";

/* ============================================================
   📦 1) GET SHOP PRODUCTS (Manager / Company)
   GET /api/manager/shop-products
============================================================ */
export const getShopProductsApi = (params = {}) =>
  api.get("/manager/shop-products", { params });

/* ============================================================
   🏬 2) GET COMPANY CATALOG (AVAILABLE PRODUCTS)
   GET /api/manager/shop-products/available
============================================================ */
export const getAvailableProductsApi = (params = {}) =>
  api.get("/manager/shop-products/available", { params });

/* ============================================================
   ➕ 3) ADD PRODUCT TO SHOP
   POST /api/manager/shop-products/add
   Body: { productId, price, stock?, shopId? }
============================================================ */
export const addProductToShopApi = (payload) =>
  api.post("/manager/shop-products/add", payload);

/* ============================================================
   💲 4) UPDATE PRICE / DISCOUNT FOR SHOP PRODUCT
   PUT /api/manager/shop-products/:id/price
============================================================ */
export const updateShopProductPriceApi = (
  shopProductId,
  price,
  discount = 0
) =>
  api.put(`/manager/shop-products/${shopProductId}/price`, {
    price,
    discount,
  });

/* ============================================================
   📦 5) UPDATE STOCK FOR SHOP PRODUCT
   PUT /api/manager/shop-products/:id/stock
============================================================ */
export const updateShopProductStockApi = (shopProductId, stock) =>
  api.put(`/manager/shop-products/${shopProductId}/stock`, { stock });

/* ============================================================
   🔁 6) TOGGLE ACTIVE / INACTIVE
   PUT /api/manager/shop-products/:id/toggle
============================================================ */
export const toggleShopProductApi = (shopProductId) =>
  api.put(`/manager/shop-products/${shopProductId}/toggle`);
