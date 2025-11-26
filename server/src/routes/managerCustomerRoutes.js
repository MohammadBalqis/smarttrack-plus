// server/src/routes/managerCustomerRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getManagerCustomers,
  getManagerCustomerDetails,
} from "../controllers/managerCustomerController.js";

const router = Router();

/* ==========================================================
   📋 MANAGER / COMPANY — CUSTOMERS LIST
========================================================== */
router.get(
  "/customers",
  protect,
  authorizeRoles("manager", "company"),
  getManagerCustomers
);

/* ==========================================================
   📌 MANAGER / COMPANY — SINGLE CUSTOMER DETAILS
========================================================== */
router.get(
  "/customer/:customerId",
  protect,
  authorizeRoles("manager", "company"),
  getManagerCustomerDetails
);

export default router;
