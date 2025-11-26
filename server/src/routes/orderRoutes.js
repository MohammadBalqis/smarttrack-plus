// server/src/routes/orderRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createOrder,
  acceptOrder,
  assignOrderDriver,
  updateOrderStatus,
  cancelOrder,
  getCompanyOrders,
  getCustomerOrders,
} from "../controllers/orderController.js";

const router = Router();

/* CUSTOMER */
router.post(
  "/create",
  protect,
  authorizeRoles("customer"),
  createOrder
);

router.get(
  "/customer",
  protect,
  authorizeRoles("customer"),
  getCustomerOrders
);

/* COMPANY + MANAGER */
router.get(
  "/company",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyOrders
);

router.put(
  "/accept/:orderId",
  protect,
  authorizeRoles("company", "manager"),
  acceptOrder
);

router.put(
  "/assign/:orderId",
  protect,
  authorizeRoles("company", "manager"),
  assignOrderDriver
);

router.put(
  "/status/:orderId",
  protect,
  authorizeRoles("company", "manager"),
  updateOrderStatus
);

router.put(
  "/cancel/:orderId",
  protect,
  authorizeRoles("company", "manager"),
  cancelOrder
);

export default router;
