// server/src/routes/companyOrderRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getCompanyOrders,
  getCompanyOrderDetails,
  updateCompanyOrderStatus,
} from "../controllers/companyOrderController.js";

const router = Router();

/* GET ALL ORDERS */
router.get(
  "/orders",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyOrders
);

/* GET SINGLE ORDER */
router.get(
  "/orders/:orderId",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyOrderDetails
);

/* UPDATE STATUS (company only) */
router.put(
  "/orders/:orderId/status",
  protect,
  authorizeRoles("company"),
  updateCompanyOrderStatus
);

export default router;
